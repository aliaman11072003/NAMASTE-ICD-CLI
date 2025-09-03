#!/usr/bin/env node

/**
 * Test script to verify ICD API authentication
 * Run this to test if your credentials are working
 */

require('dotenv').config();
const axios = require('axios');

async function testICDAuth() {
  console.log('🔍 Testing ICD API Authentication...\n');
  
  // Check environment variables
  const clientId = process.env.ICD_CLIENT_ID;
  const clientSecret = process.env.ICD_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.error('❌ Missing ICD API credentials!');
    console.error('Please run: ./setup-env.sh');
    process.exit(1);
  }
  
  console.log('✅ Credentials found in environment');
  console.log(`   Client ID: ${clientId.substring(0, 20)}...`);
  console.log(`   Client Secret: ${clientSecret.substring(0, 20)}...\n`);
  
  // First, let's test if the API is publicly accessible
  console.log('🌐 Testing public API access...');
  const baseUrl = process.env.WHO_API_BASE_URL || 'https://id.who.int/icd/release/11/2023';
  const testUrl = `${baseUrl}/search?q=test&propertiesToBeSearched=Title&useFlexisearch=true&flatResults=false`;
  
  try {
    const publicResponse = await axios.get(testUrl, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json, application/ld+json',
        'User-Agent': 'NAMASTE-ICD-CLI/1.0.0'
      }
    });
    
    if (publicResponse.status === 200) {
      console.log('✅ API is publicly accessible without authentication!');
      console.log(`   Status: ${publicResponse.status}`);
      
      if (publicResponse.data && publicResponse.data.destinationEntities) {
        console.log(`   Found ${publicResponse.data.destinationEntities.length} test results`);
      }
      
      console.log('\n🎉 No authentication required! The API is publicly accessible.');
      console.log('   You can now use the CLI commands directly.');
      return;
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('🔒 API requires authentication - proceeding with OAuth 2...\n');
    } else {
      console.log('⚠️  Public access test failed, trying OAuth 2...\n');
    }
  }
  
  // Test OAuth 2 token endpoint
  const tokenEndpoint = 'https://icdaccessmanagement.who.int/connect/token';
  
  try {
    console.log('🔑 Testing OAuth 2 token endpoint...');
    console.log(`   URL: ${tokenEndpoint}`);
    
    // Try using Basic auth in Authorization header (standard OAuth 2 approach)
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const tokenResponse = await axios.post(tokenEndpoint, 
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        timeout: 10000
      }
    );
    
    if (tokenResponse.data && tokenResponse.data.access_token) {
      console.log('✅ OAuth 2 authentication successful!');
      console.log(`   Token type: ${tokenResponse.data.token_type}`);
      console.log(`   Expires in: ${tokenResponse.data.expires_in} seconds`);
      
      const accessToken = tokenResponse.data.access_token;
      
      // Now test the actual ICD API with the token
      console.log('\n🌐 Testing ICD API with access token...');
      
      const apiResponse = await axios.get(testUrl, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json, application/ld+json',
          'User-Agent': 'NAMASTE-ICD-CLI/1.0.0',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (apiResponse.status === 200) {
        console.log('✅ ICD API access successful!');
        console.log(`   Status: ${apiResponse.status}`);
        
        if (apiResponse.data && apiResponse.data.destinationEntities) {
          console.log(`   Found ${apiResponse.data.destinationEntities.length} test results`);
        }
      } else {
        console.log(`⚠️  Unexpected API status: ${apiResponse.status}`);
      }
      
    } else {
      console.error('❌ No access token in OAuth response');
      console.error('Response data:', tokenResponse.data);
    }
    
  } catch (error) {
    if (error.response) {
      console.error(`❌ OAuth Error: ${error.response.status} - ${error.response.statusText}`);
      
      if (error.response.status === 400) {
        console.error('   Bad Request - This usually means:');
        console.error('   - Invalid client credentials format');
        console.error('   - Missing required parameters');
        console.error('   - Incorrect grant_type');
        console.error('   - The API might be publicly accessible');
      } else if (error.response.status === 401) {
        console.error('   Unauthorized - Invalid client credentials');
        console.error('   Please verify your ICD_CLIENT_ID and ICD_CLIENT_SECRET');
      } else if (error.response.status === 403) {
        console.error('   Forbidden - Insufficient permissions');
        console.error('   Please check if your API key has the required access');
      } else if (error.response.data) {
        console.error('   Response data:', error.response.data);
      }
    } else if (error.request) {
      console.error('❌ Network Error: No response received');
      console.error('   Please check your internet connection');
    } else {
      console.error(`❌ Error: ${error.message}`);
    }
    
    console.log('\n💡 Suggestion: The API might be publicly accessible without authentication.');
    console.log('   Try running a CLI command directly to test.');
    
    process.exit(1);
  }
  
  console.log('\n🎉 Authentication test completed successfully!');
  console.log('   You can now use the CLI commands with full API access.');
}

// Run the test
testICDAuth().catch(console.error);
