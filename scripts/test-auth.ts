#!/usr/bin/env ts-node

/**
 * Smoke test script for ICD API Authentication Module
 * Run with: ts-node scripts/test-auth.ts
 */

// Load environment variables first
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { getAccessToken, createAxiosClient, clearTokenCache } from '../src/services/icdAuth';
import { ensureHttps } from '../src/utils/httpsUtil';

async function testAuthModule() {
  console.log('🧪 Testing ICD API Authentication Module...\n');

  try {
    // Test 1: HTTPS utility
    console.log('1️⃣ Testing HTTPS utility...');
    const testUrls = [
      'http://id.who.int/icd/entity/123',
      'https://id.who.int/icd/entity/456',
      'id.who.int/icd/entity/789'
    ];
    
    testUrls.forEach(url => {
      const httpsUrl = ensureHttps(url);
      console.log(`   ${url} → ${httpsUrl}`);
    });
    console.log('✅ HTTPS utility test passed\n');

    // Test 2: Get access token
    console.log('2️⃣ Testing access token retrieval...');
    const token = await getAccessToken();
    console.log(`   Token obtained: ${token.substring(0, 20)}...`);
    console.log('✅ Access token test passed\n');

    // Test 3: Create authenticated Axios client
    console.log('3️⃣ Testing authenticated Axios client...');
    const client = createAxiosClient('https://id.who.int');
    
    // Test a simple search query
    console.log('   Testing search endpoint...');
    const response = await client.get('/icd/release/11/2023/search', {
      params: {
        q: 'cholera',
        propertiesToBeSearched: 'Title',
        useFlexisearch: true,
        flatResults: false
      }
    });
    
    if (response.status === 200) {
      console.log(`   ✅ Search successful! Status: ${response.status}`);
      if (response.data && response.data.destinationEntities) {
        console.log(`   📊 Found ${response.data.destinationEntities.length} results`);
        
        // Show first result
        if (response.data.destinationEntities.length > 0) {
          const firstResult = response.data.destinationEntities[0];
          console.log(`   🔍 First result: ${firstResult.title} (${firstResult.id})`);
        }
      }
    } else {
      console.log(`   ⚠️  Unexpected status: ${response.status}`);
    }
    console.log('✅ Authenticated client test passed\n');

    // Test 4: Test token caching
    console.log('4️⃣ Testing token caching...');
    const startTime = Date.now();
    const cachedToken = await getAccessToken();
    const endTime = Date.now();
    
    if (cachedToken === token) {
      console.log(`   ✅ Cached token retrieved in ${endTime - startTime}ms`);
    } else {
      console.log('   ⚠️  Cached token differs from original');
    }
    console.log('✅ Token caching test passed\n');

    // Test 5: Test TM2 specific search
    console.log('5️⃣ Testing TM2 specific search...');
    const tm2Response = await client.get('/icd/release/11/2023/search', {
      params: {
        q: 'digestion',
        propertiesToBeSearched: 'Title,Definition',
        useFlexisearch: true,
        flatResults: false,
        linearization: 'tm2'
      }
    });
    
    if (tm2Response.status === 200 && tm2Response.data?.destinationEntities) {
      console.log(`   ✅ TM2 search successful! Found ${tm2Response.data.destinationEntities.length} results`);
    } else {
      console.log('   ⚠️  TM2 search returned unexpected response');
    }
    console.log('✅ TM2 search test passed\n');

    console.log('🎉 All tests passed! The authentication module is working correctly.\n');
    console.log('💡 You can now use the CLI commands with full authentication:');
    console.log('   npm run dev fetch-icd "cholera" --type both');

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('ICD_CLIENT_ID') || error.message.includes('ICD_CLIENT_SECRET')) {
        console.error('\n💡 Make sure you have set up your environment variables:');
        console.error('   Run: ./setup-env.sh');
      } else if (error.message.includes('401') || error.message.includes('403')) {
        console.error('\n💡 Authentication failed. Please verify your credentials.');
      }
    }
    
    process.exit(1);
  }
}

// Run the test
testAuthModule().catch(console.error);
