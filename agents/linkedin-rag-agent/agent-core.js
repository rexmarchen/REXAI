const { retrieveRelevantChunks } = require("./vector-store");
const { findRelevantMemories, getRecentMemories, addMemory } = require("./mongo-store");
const { researchTopicForPost, markRepoAsPosted } = require("./ai-researcher");

try {
  require("dotenv").config();
} catch {}

const CONFIG = {
  textModel: process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash",
  imageModel: process.env.GEMINI_IMAGE_MODEL || "imagen-3.0-generate-002",
};

async function retrieveContext(topic, topK = 4) {
  const contextParts = [];

  // 1. Retrieve semantic memories
  try {
    const memories = await findRelevantMemories(topic, topK);
    for (const m of memories) {
      if (m.score > 0.35) {
        contextParts.push(`- [Memory - ${m.type || "note"}] ${m.content}`);
      }
    }
  } catch (err) {
    console.warn("[Memory Notice] Could not retrieve memories:", err.message);
  }

  // 2. Retrieve local document chunks
  try {
    const chunks = await retrieveRelevantChunks(topic, topK);
    for (const c of chunks) {
      contextParts.push(`- [Doc Chunk - from ${c.source || "knowledge"}] ${c.text}`);
    }
  } catch (err) {}

  // 3. Fallback recent activity
  if (contextParts.length === 0) {
    try {
      const recent = await getRecentMemories(2);
      for (const r of recent) {
        contextParts.push(`- [Recent Activity - ${r.type || "note"}] ${r.content}`);
      }
    } catch {}
  }

  return contextParts.join("\n");
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generatePost(topic, context) {
  const authorName = process.env.AUTHOR_NAME || "a software engineer & computer science student";
  const prompt = `You are drafting a LinkedIn post for ${authorName} who wants to build a professional, authentic personal brand — not generic marketing copy.

TOPIC: ${topic}

CONTEXT RETRIEVED FROM THE AUTHOR'S OWN DOCUMENTS AND CODE REPOSITORIES (use this to keep the voice authentic and specific — do not contradict it, and prefer concrete details from it over generic claims; if it's not relevant to the topic, rely on the topic alone):
${context || "(no relevant context found)"}

Write a LinkedIn post following these rules:
- 100-180 words
- Open with a specific, concrete hook — not "In today's world" or "I'm excited to share"
- Sound like a real builder/engineer talking, not a corporate marketing account
- Use at least one concrete detail, metric, or technical pattern from the context above if it's genuinely relevant
- Include one short line break for readability
- End with a genuine question that invites insightful comments (not "Thoughts?")
- Add 3-5 relevant, specific hashtags at the very end (e.g. #softwareengineering #webdev #systemdesign)

Then decide: would a simple supporting visual graphic (e.g. an architecture diagram, flow chart, or conceptual tech visual) meaningfully improve this specific post? Most posts do NOT need one — only say yes if it clearly adds value.

Respond with ONLY valid JSON in this exact shape, nothing else:
{
  "post_text": "<the full post text>",
  "needs_image": true or false,
  "image_prompt": "<a concise text-to-image prompt, or empty string if needs_image is false>"
}`;

  const configuredModel = process.env.GEMINI_TEXT_MODEL;
  const candidateModels = Array.from(
    new Set([
      configuredModel,
      "gemini-2.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.6-flash",
      "gemini-3.7-flash",
      "gemini-2.0-flash",
    ].filter(Boolean))
  );

  let lastError = null;
  for (const model of candidateModels) {
    const maxRetries = 2;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          lastError = new Error(`Gemini generateContent error (${response.status}): ${errText}`);
          if ((response.status === 503 || response.status === 429) && attempt < maxRetries) {
            console.warn(`[Gemini Warning] Model ${model} returned ${response.status} (attempt ${attempt}/${maxRetries}), retrying in 1.5s...`);
            await sleep(1500 * attempt);
            continue;
          }
          console.warn(`[Gemini Info] Model ${model} returned ${response.status}, attempting fallback model...`);
          break;
        }

        const data = await response.json();
        const textPart = data.candidates?.[0]?.content?.parts?.find((p) => p.text);
        const rawText = textPart ? textPart.text : data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw new Error("No text returned by Gemini");

        const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch {}
        }

        return {
          post_text: cleaned,
          needs_image: false,
          image_prompt: "",
        };
      } catch (err) {
        lastError = err;
        if (attempt < maxRetries) {
          await sleep(1000 * attempt);
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error("All candidate Gemini models failed.");
}

async function generateImage(imagePrompt) {
  const candidateImageModels = Array.from(
    new Set([
      CONFIG.imageModel,
      "imagen-3.0-generate-002",
      "gemini-3.1-flash-image",
      "gemini-2.5-flash-image",
    ].filter(Boolean))
  );

  let lastErr = null;
  for (const model of candidateImageModels) {
    try {
      const isImagen = model.startsWith("imagen");
      const url = isImagen
        ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`
        : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      const requestBody = isImagen
        ? {
            instances: [{ prompt: imagePrompt }],
            parameters: { sampleCount: 1, aspectRatio: "1:1", outputOptions: { mimeType: "image/jpeg" } },
          }
        : {
            contents: [{ parts: [{ text: imagePrompt }] }],
          };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        lastErr = new Error(`Image generation error for ${model} (${response.status}): ${await response.text()}`);
        continue;
      }

      const data = await response.json();

      if (data.predictions?.[0]?.bytesBase64Encoded) {
        return Buffer.from(data.predictions[0].bytesBase64Encoded, "base64");
      }

      const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
      if (imagePart?.inlineData?.data) {
        return Buffer.from(imagePart.inlineData.data, "base64");
      }
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error("All image candidate models failed.");
}

async function getAuthorUrn() {
  let urn = (process.env.LINKEDIN_PERSON_URN || "").trim();
  if (urn) {
    return urn.startsWith("urn:li:person:") ? urn : `urn:li:person:${urn}`;
  }

  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Missing LINKEDIN_ACCESS_TOKEN environment variable.");
  }

  const response = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`LinkedIn userinfo error (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  if (!data.sub) {
    throw new Error("Unable to retrieve LinkedIn person ID (sub) from userinfo.");
  }

  return `urn:li:person:${data.sub}`;
}

async function uploadImageToLinkedIn(imageBuffer) {
  const authorUrn = await getAuthorUrn();
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;

  const initResponse = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "LinkedIn-Version": process.env.LINKEDIN_VERSION || "202603",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({ initializeUploadRequest: { owner: authorUrn } }),
  });

  if (!initResponse.ok) {
    throw new Error(`LinkedIn image init error (${initResponse.status}): ${await initResponse.text()}`);
  }

  const initData = await initResponse.json();
  const uploadUrl = initData.value.uploadUrl;
  const imageUrn = initData.value.image;

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "image/jpeg",
    },
    body: imageBuffer,
  });

  if (!uploadResponse.ok) {
    throw new Error(`LinkedIn image upload error (${uploadResponse.status}): ${await uploadResponse.text()}`);
  }

  return imageUrn;
}

async function publishPost(text, imageUrn = null) {
  const authorUrn = await getAuthorUrn();
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;

  const body = {
    author: authorUrn,
    commentary: text,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  if (imageUrn) {
    body.content = { media: { id: imageUrn } };
  }

  const response = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": process.env.LINKEDIN_VERSION || "202603",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`LinkedIn post error (${response.status}): ${await response.text()}`);
  }

  return response.headers.get("x-restli-id") || `published_${Date.now()}`;
}

async function runAgentForTopic(topic, options = {}) {
  const context = await retrieveContext(topic);
  const { post_text, needs_image, image_prompt } = await generatePost(topic, context);

  let imageUrn = null;
  if (!options.dryRun && needs_image && image_prompt) {
    try {
      const imageBuffer = await generateImage(image_prompt);
      imageUrn = await uploadImageToLinkedIn(imageBuffer);
    } catch (imgErr) {
      console.warn("[Agent Warning] Optional image generation skipped:", imgErr.message);
    }
  }

  let postId = null;
  if (!options.dryRun) {
    postId = await publishPost(post_text, imageUrn);
  }

  return {
    postId,
    postText: post_text,
    hadImage: Boolean(imageUrn),
    needsImage: needs_image,
    imagePrompt: image_prompt,
  };
}

async function generateAutonomousPost(targetRepoName = null, options = {}) {
  const research = await researchTopicForPost(targetRepoName);
  console.log(`[Autonomous Agent] Researched project "${research.repoName}": ${research.topicTitle}`);

  const promptTopic = `${research.topicTitle} (${research.repoName} in ${research.language})`;
  const { post_text, needs_image, image_prompt } = await generatePost(promptTopic, research.ragContext);

  let imageUrn = null;
  if (!options.dryRun && needs_image && image_prompt) {
    try {
      console.log(`[Autonomous Agent] Generating visual illustration for this engineering story...`);
      const imageBuffer = await generateImage(image_prompt);
      imageUrn = await uploadImageToLinkedIn(imageBuffer);
      console.log(`[Autonomous Agent] Image uploaded to LinkedIn. URN: ${imageUrn}`);
    } catch (imgErr) {
      console.warn("[Autonomous Agent Warning] Image generation bypassed:", imgErr.message);
    }
  }

  let postId = null;
  if (!options.dryRun) {
    postId = await publishPost(post_text, imageUrn);
    await markRepoAsPosted(research.repoName);

    try {
      await addMemory(
        `LinkedIn post published about ${research.repoName} (${research.topicTitle}): ${post_text}`,
        "published_post",
        `linkedin:${research.repoKey}`,
        { repoName: research.repoName, topic: research.topicTitle, postId }
      );
    } catch (err) {}
  }

  return {
    postId,
    postText: post_text,
    hadImage: Boolean(imageUrn),
    needsImage: needs_image,
    imagePrompt: image_prompt,
    repoName: research.repoName,
    topicTitle: research.topicTitle,
    dryRun: Boolean(options.dryRun),
  };
}

module.exports = {
  runAgentForTopic,
  generateAutonomousPost,
  retrieveContext,
  generatePost,
  generateImage,
  uploadImageToLinkedIn,
  publishPost,
  getAuthorUrn,
  CONFIG,
};
