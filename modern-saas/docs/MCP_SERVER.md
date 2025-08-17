# GitHub MCP Server Documentation

This repository includes a custom GitHub MCP (Model Context Protocol) server that provides AI assistants with GitHub API integration capabilities.

## Overview

The GitHub MCP server is a standalone Node.js application that exposes GitHub functionality through the MCP protocol, allowing AI assistants to interact with GitHub repositories, issues, pull requests, and more.

## Features

- **Repository Management** - Create, read, update repositories
- **Issue Management** - Create, list, update, and close issues
- **Pull Request Operations** - Create, review, merge pull requests
- **File Operations** - Read, create, update files in repositories
- **Branch Management** - Create, list, switch branches
- **Organization Access** - Access organization repositories and settings
- **User Management** - Get user information and permissions

## Quick Start

### Prerequisites

- Node.js 18+
- GitHub Personal Access Token
- MCP-compatible client (like Windsurf IDE)

### Installation

1. **Navigate to the project root**:
   ```bash
   cd /Users/tonysheehan/code/post_generator
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your GitHub token:
   ```env
   GITHUB_TOKEN=your_github_personal_access_token_here
   PORT=3000
   MCP_SERVER_NAME=github-mcp-server
   CORS_ORIGIN=*
   ```

4. **Start the server**:
   ```bash
   # HTTP mode (recommended)
   node src/server.js --http
   
   # Or with PM2 for production
   pm2 start src/server.js --name github-mcp -- --http
   ```

## Configuration

### GitHub Personal Access Token

Create a GitHub Personal Access Token with these permissions:

- `repo` - Full repository access
- `user` - User information access  
- `read:org` - Organization access
- `workflow` - GitHub Actions (optional)
- `admin:repo_hook` - Repository webhooks (optional)

### Environment Variables

```env
# Required
GITHUB_TOKEN=your_github_personal_access_token_here

# Optional
PORT=3000                           # Server port
MCP_SERVER_NAME=github-mcp-server  # Server identifier
CORS_ORIGIN=*                      # CORS configuration
GITHUB_APP_ID=                     # GitHub App ID (advanced)
GITHUB_APP_PRIVATE_KEY=            # GitHub App private key (advanced)
GITHUB_WEBHOOK_SECRET=             # Webhook secret (advanced)
```

## MCP Client Configuration

### Windsurf IDE

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "github-mcp-server": {
      "transport": "http",
      "url": "http://localhost:3000"
    }
  }
}
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "github-mcp-server": {
      "command": "node",
      "args": ["/path/to/post_generator/src/server.js"],
      "env": {
        "GITHUB_TOKEN": "your_token_here"
      }
    }
  }
}
```

### Remote HTTP Configuration

For remote deployment:

```json
{
  "mcpServers": {
    "github-mcp-remote": {
      "transport": "http",
      "url": "https://your-deployed-server.com",
      "headers": {
        "Authorization": "Bearer your-api-key"
      }
    }
  }
}
```

## Server Architecture

### Core Components

```
src/
└── server.js              # Main MCP server implementation
    ├── GitHubMCPServer    # Main server class
    ├── GitHub API Client  # Octokit integration
    ├── MCP Tools         # Available tools/functions
    ├── HTTP Server       # Express.js server
    └── Error Handling    # Comprehensive error handling
```

### Available Tools

The server exposes these MCP tools:

#### Repository Operations
- `github_get_repo` - Get repository information
- `github_list_repos` - List user/org repositories
- `github_create_repo` - Create new repository
- `github_update_repo` - Update repository settings

#### File Operations
- `github_get_file` - Read file contents
- `github_create_file` - Create new file
- `github_update_file` - Update existing file
- `github_delete_file` - Delete file

#### Issue Management
- `github_list_issues` - List repository issues
- `github_get_issue` - Get specific issue
- `github_create_issue` - Create new issue
- `github_update_issue` - Update issue
- `github_close_issue` - Close issue

#### Pull Request Operations
- `github_list_prs` - List pull requests
- `github_get_pr` - Get specific pull request
- `github_create_pr` - Create pull request
- `github_merge_pr` - Merge pull request

#### Branch Management
- `github_list_branches` - List repository branches
- `github_create_branch` - Create new branch
- `github_get_branch` - Get branch information

## Deployment

### Local Development

```bash
# Start in development mode
npm run dev

# Start in production mode
npm start

# Run tests
npm test
```

### Production Deployment

#### Heroku

```bash
# Create Heroku app
heroku create your-github-mcp-server

# Set environment variables
heroku config:set GITHUB_TOKEN=your_token_here

# Deploy
git push heroku main
```

#### Docker

```bash
# Build image
docker build -t github-mcp-server .

# Run container
docker run -p 3000:3000 -e GITHUB_TOKEN=your_token_here github-mcp-server
```

#### PM2 (Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start src/server.js --name github-mcp -- --http

# Save PM2 configuration
pm2 save
pm2 startup
```

## Health Monitoring

### Health Check Endpoint

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "healthy",
  "server": "github-mcp-server",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Logging

The server provides comprehensive logging:

```bash
# Server startup
GitHub MCP Server running on http://localhost:3000

# Tool execution
[INFO] Executing tool: github_get_repo
[INFO] Repository accessed: owner/repo

# Error handling
[ERROR] GitHub API error: Not Found (404)
```

## Security

### Best Practices

1. **Token Security**
   - Never commit tokens to version control
   - Use environment variables
   - Rotate tokens regularly
   - Use minimal required permissions

2. **Network Security**
   - Use HTTPS in production
   - Configure CORS appropriately
   - Implement rate limiting
   - Use API keys for remote access

3. **Access Control**
   - Validate all inputs
   - Implement proper error handling
   - Log security events
   - Monitor for unusual activity

### Rate Limiting

GitHub API has rate limits:
- **Authenticated requests**: 5,000 per hour
- **Search API**: 30 requests per minute
- **GraphQL API**: 5,000 points per hour

The server handles rate limiting automatically and provides appropriate error messages.

## Troubleshooting

### Common Issues

**Server won't start**
```bash
# Check if port is in use
lsof -i :3000

# Check environment variables
echo $GITHUB_TOKEN
```

**Authentication errors**
```bash
# Test token manually
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
```

**MCP client connection issues**
```bash
# Test HTTP endpoint
curl http://localhost:3000/health

# Check server logs
pm2 logs github-mcp
```

### Debug Mode

Enable debug logging:

```bash
DEBUG=github-mcp:* node src/server.js --http
```

### Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run specific test
node test/test.js
```

## API Reference

### Tool Schemas

Each MCP tool has a defined schema. Example:

```json
{
  "name": "github_get_repo",
  "description": "Get repository information",
  "inputSchema": {
    "type": "object",
    "properties": {
      "owner": {"type": "string"},
      "repo": {"type": "string"}
    },
    "required": ["owner", "repo"]
  }
}
```

### Error Responses

Standard error format:

```json
{
  "error": {
    "code": "GITHUB_API_ERROR",
    "message": "Repository not found",
    "details": {
      "status": 404,
      "url": "https://api.github.com/repos/owner/repo"
    }
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This MCP server is part of the Modern SaaS project and is licensed under the MIT License.
