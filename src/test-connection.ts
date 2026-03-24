// Test script to verify LinkedIn API connection
import 'dotenv/config';
import { Client, getUserPosts, extractProfileIdLinkedin, getUserMiniProfile } from '@florydev/linkedin-api-voyager';
import { missingCredentials, isAppError } from './errors.ts';

async function test(): Promise<void> {
  console.log('🧪 Testing LinkedIn API connection...\n');

  // 1. Check environment variables
  console.log('1️⃣ Checking environment variables...');
  const liAt = process.env.LINKEDIN_LI_AT;
  const jsessionId = process.env.LINKEDIN_JSESSIONID;

  if (!liAt || !jsessionId) {
    throw missingCredentials();
  }

  console.log('   ✅ LINKEDIN_LI_AT:', liAt.substring(0, 20) + '...');
  console.log('   ✅ LINKEDIN_JSESSIONID:', jsessionId);

  // 2. Initialize client
  console.log('\n2️⃣ Initializing client...');
  Client({
    JSESSIONID: jsessionId,
    li_at: liAt,
  });
  console.log('   ✅ Client initialized');

  // 3. Test profile info
  console.log('\n3️⃣ Testing: Get profile info...');
  try {
    const profile = await getUserMiniProfile('yolandyan');
    console.log('   ✅ Profile found:');
    console.log(`      Name: ${profile.firstName} ${profile.lastName}`);
    console.log(`      Headline: ${profile.headline}`);
  } catch (err) {
    console.error('   ❌ Failed:', err instanceof Error ? err.message : String(err));
  }

  // 4. Test profile ID extraction
  console.log('\n4️⃣ Testing: Extract profile ID...');
  try {
    const profileId = await extractProfileIdLinkedin('yolandyan');
    console.log('   ✅ Profile ID:', profileId);
  } catch (err) {
    console.error('   ❌ Failed:', err instanceof Error ? err.message : String(err));
  }

  // 5. Test fetching posts
  console.log('\n5️⃣ Testing: Fetch 5 posts...');
  try {
    const posts = await getUserPosts({
      identifier: 'yolandyan',
      start: 0,
      count: 5,
    });

    console.log(`   ✅ Fetched ${posts?.length ?? 0} posts`);

    if (posts && posts.length > 0) {
      console.log('\n   📝 Sample post:');
      const sample = posts[0];
      console.log(`      URL: ${sample.postUrl ?? 'N/A'}`);
      console.log(`      Date: ${sample.dateDescription ?? 'N/A'}`);
      console.log(`      Likes: ${sample.numLikes ?? 0}`);
      console.log(`      Comments: ${sample.numComments ?? 0}`);
      const text = (sample.contentText ?? sample.text ?? 'N/A').substring(0, 100);
      console.log(`      Text: ${text}...`);
    }
  } catch (err) {
    console.error('   ❌ Failed:', err instanceof Error ? err.message : String(err));
    if (isAppError(err)) {
      console.error(`      Code: ${err.code}, Status: ${err.statusCode}`);
    }
  }

  console.log('\n✅ Test complete!');
}

test().catch((err) => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
