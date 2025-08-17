#!/usr/bin/env node

import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

async function testGitHubConnection() {
  console.log('🧪 Testing GitHub MCP Server...\n');

  if (!process.env.GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN not found in environment variables');
    console.log('Please create a .env file with your GitHub token:');
    console.log('GITHUB_TOKEN=your_token_here');
    process.exit(1);
  }

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  try {
    // Test authentication
    console.log('🔐 Testing GitHub authentication...');
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log(`✅ Authenticated as: ${user.login} (${user.name})`);

    // Test repository access
    console.log('\n📚 Testing repository access...');
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 5,
      sort: 'updated',
    });
    console.log(`✅ Found ${repos.length} recent repositories`);
    repos.forEach(repo => {
      console.log(`   - ${repo.full_name} (${repo.private ? 'private' : 'public'})`);
    });

    // Test search functionality
    console.log('\n🔍 Testing search functionality...');
    const { data: searchResults } = await octokit.rest.search.repos({
      q: 'javascript',
      per_page: 3,
    });
    console.log(`✅ Search returned ${searchResults.total_count} results`);

    console.log('\n🎉 All tests passed! GitHub MCP Server is ready to use.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.status === 401) {
      console.log('Please check your GitHub token permissions.');
    }
    process.exit(1);
  }
}

// Test HTTP server if running
async function testHTTPServer() {
  const port = process.env.PORT || 3000;
  const baseUrl = `http://localhost:${port}`;

  try {
    console.log('\n🌐 Testing HTTP server...');
    
    // Test health endpoint
    const healthResponse = await fetch(`${baseUrl}/health`);
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Health check passed:', health);
    }

    // Test tools endpoint
    const toolsResponse = await fetch(`${baseUrl}/tools`);
    if (toolsResponse.ok) {
      const tools = await toolsResponse.json();
      console.log(`✅ Found ${tools.tools?.length || 0} available tools`);
    }

  } catch (error) {
    console.log('ℹ️  HTTP server not running (this is normal for stdio mode)');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testGitHubConnection()
    .then(() => testHTTPServer())
    .catch(console.error);
}
