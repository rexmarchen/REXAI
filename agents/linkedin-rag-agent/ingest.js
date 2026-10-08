const fs = require("fs");
const path = require("path");
const { isSupported, extractText } = require("./file-readers");
const { splitIntoChunks } = require("./chunker");
const { addDocumentChunks } = require("./vector-store");

try {
  require("dotenv").config();
} catch {}

const DOCUMENTS_DIR = path.join(__dirname, "documents");

async function ingestFile(filePath) {
  console.log(`[Ingest] Reading: ${filePath}`);
  const text = await extractText(filePath);
  if (!text || !text.trim()) {
    console.log(`[Ingest] Skipping empty file: ${filePath}`);
    return 0;
  }

  const chunks = splitIntoChunks(text);
  console.log(`[Ingest] Chunked into ${chunks.length} pieces. Generating embeddings...`);

  const formattedChunks = chunks.map((chunkText) => ({
    text: chunkText,
    source: path.basename(filePath),
    createdAt: new Date().toISOString(),
  }));

  await addDocumentChunks(formattedChunks);
  console.log(`[Ingest] Successfully indexed ${chunks.length} chunks from ${path.basename(filePath)}.`);
  return chunks.length;
}

async function ingestDirectory(dirPath = DOCUMENTS_DIR) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`[Ingest] Created directory: ${dirPath}. Add .pdf, .md, .txt, or .docx files here to index.`);
    return;
  }

  const files = fs.readdirSync(dirPath);
  let totalChunks = 0;

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isFile() && isSupported(fullPath)) {
      try {
        const count = await ingestFile(fullPath);
        totalChunks += count;
      } catch (err) {
        console.error(`[Ingest Error] Could not index ${file}:`, err.message);
      }
    }
  }

  console.log(`\n[Ingest Summary] Total new chunks indexed: ${totalChunks}`);
}

if (require.main === module) {
  const target = process.argv[2] ? path.resolve(process.argv[2]) : DOCUMENTS_DIR;
  if (fs.existsSync(target) && fs.statSync(target).isFile()) {
    ingestFile(target).catch((err) => console.error("[Ingest Error]:", err.message));
  } else {
    ingestDirectory(target).catch((err) => console.error("[Ingest Error]:", err.message));
  }
}

module.exports = { ingestFile, ingestDirectory };
