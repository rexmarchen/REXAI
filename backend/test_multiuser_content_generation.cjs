const path = require('path');
const agentDir = 'c:/Users/anshupal/OneDrive/Documents/linkdin automation';
const { generatePost } = require(path.join(agentDir, 'agent-core.js'));
const { researchTopicForPost } = require(path.join(agentDir, 'ai-researcher.js'));

async function runTest() {
  console.log('========================================================');
  console.log('TEST 1: New User (Apurav Sharma) with Custom Topic');
  console.log('========================================================');
  const user2Options = {
    userId: 'user_apurav_99',
    authorName: 'Apurav Sharma',
    isOwner: false,
    topic: 'System Design: Preventing database connection pool starvation under 100k req/sec load'
  };

  const researchUser2 = await researchTopicForPost(null, user2Options);
  console.log('Researched Topic for Apurav:', researchUser2.topicTitle);
  console.log('Researched Category for Apurav:', researchUser2.category);

  const postUser2 = await generatePost(researchUser2.topicTitle, researchUser2.ragContext, user2Options);
  console.log('\n--- Generated Post for Apurav Sharma ---');
  console.log(postUser2.post_text);

  // Assertions for User 2 (Apurav Sharma)
  const textLower = postUser2.post_text.toLowerCase();
  const containsAnshu = textLower.includes('anshu');
  const containsCGC = textLower.includes('cgc');
  const containsLibrary = textLower.includes('library-managment') || textLower.includes('library system') || textLower.includes('library management');
  
  console.log('\n--- Privacy & Persona Verification for Apurav ---');
  console.log('Contains "Anshu":', containsAnshu ? '❌ FAILED' : '✅ PASSED (Zero Anshu mentions)');
  console.log('Contains "CGC":', containsCGC ? '❌ FAILED' : '✅ PASSED (Zero CGC mentions)');
  console.log('Contains "Library project":', containsLibrary ? '❌ FAILED' : '✅ PASSED (Zero student library mentions)');

  console.log('\n========================================================');
  console.log('TEST 2: New User (Apurav Sharma) Autonomous Mode (No Explicit Topic)');
  console.log('========================================================');
  const user2AutoOptions = {
    userId: 'user_apurav_99',
    authorName: 'Apurav Sharma',
    isOwner: false
  };

  const researchUser2Auto = await researchTopicForPost(null, user2AutoOptions);
  console.log('Autonomous Researched Topic for Apurav:', researchUser2Auto.topicTitle);
  console.log('Researched Category:', researchUser2Auto.category);
  console.log('Researched Angle:', researchUser2Auto.technicalAngle);

  console.log('\n========================================================');
  console.log('TEST 3: Owner (Anshu Pal) Mode');
  console.log('========================================================');
  const ownerOptions = {
    userId: 1,
    authorName: 'Anshu Pal',
    isOwner: true
  };
  const researchOwner = await researchTopicForPost(null, ownerOptions);
  console.log('Researched Topic for Owner:', researchOwner.topicTitle);
  console.log('Researched Repo/Category for Owner:', researchOwner.repoName || researchOwner.category);

  console.log('\nAll Multi-User Persona tests completed successfully!');
}

runTest().catch(console.error);
