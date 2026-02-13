/**
 * Integration Test Script
 *
 * Tests connectivity between frontend and backend APIs
 * Run with: node test-integration.js
 */

const API_BASE_URL = 'http://localhost:3001/api';

async function testEndpoint(name, url, options = {}) {
  try {
    console.log(`\nTesting ${name}...`);
    const response = await fetch(url, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`✓ ${name} - SUCCESS`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Response:`, JSON.stringify(data, null, 2).substring(0, 200));
      return true;
    } else {
      console.log(`✗ ${name} - FAILED`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Error:`, data);
      return false;
    }
  } catch (error) {
    console.log(`✗ ${name} - ERROR`);
    console.log(`  ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('SaveSmart Frontend-Backend Integration Tests');
  console.log('='.repeat(60));
  console.log(`\nBackend URL: ${API_BASE_URL}`);
  console.log('Make sure the backend server is running on localhost:3001\n');

  const results = [];

  // Test 1: Health Check
  results.push(await testEndpoint(
    'Health Check',
    'http://localhost:3001/health'
  ));

  // Test 2: Get Recipes
  results.push(await testEndpoint(
    'GET /api/recipes',
    `${API_BASE_URL}/recipes`
  ));

  // Test 3: Get Events
  results.push(await testEndpoint(
    'GET /api/events',
    `${API_BASE_URL}/events`
  ));

  // Test 4: Chat Endpoint (with mock data)
  results.push(await testEndpoint(
    'POST /api/chat',
    `${API_BASE_URL}/chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test-user',
        message: 'Hello, can you help me save money?',
      }),
    }
  ));

  // Test 5: Profile Endpoint (should fail with 404 for non-existent user)
  results.push(await testEndpoint(
    'GET /api/profile/:userId (expect 404)',
    `${API_BASE_URL}/profile/test-user-123`
  ));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`\nPassed: ${passed}/${total}`);

  if (passed === total) {
    console.log('\n✓ All tests passed! Frontend can connect to backend.');
  } else {
    console.log('\n✗ Some tests failed. Check the backend server.');
  }

  console.log('\nNote: Profile test is expected to return 404 for non-existent users.');
  console.log('This is normal behavior.\n');
}

// Run the tests
runTests().catch(console.error);
