# GitHub MCP Server - Deployment Guide

## Quick Start

### 1. Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your GitHub token
# Get token from: https://github.com/settings/tokens
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Test Connection
```bash
npm test
```

### 4. Run Locally
```bash
# Run as MCP server (stdio)
npm start

# Run as HTTP server
npm start -- --http
```

## Remote Deployment Options

### Option 1: Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Option 2: Cloud Deployment

#### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway add
railway deploy
```

#### Render
1. Connect your GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically on push

#### Heroku
```bash
# Install Heroku CLI and login
heroku create your-github-mcp-server
heroku config:set GITHUB_TOKEN=your_token_here
git push heroku main
```

### Option 3: VPS Deployment
```bash
# On your VPS
git clone <your-repo>
cd post_generator
npm install --production
pm2 start src/server.js --name github-mcp -- --http
```

## MCP Client Configuration

### Claude Desktop
Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

### Remote MCP Configuration
For remote deployment, use HTTP transport:

```json
{
  "mcpServers": {
    "github-mcp-remote": {
      "transport": "http",
      "url": "https://your-deployed-server.com",
      "headers": {
        "Authorization": "Bearer your_api_key"
      }
    }
  }
}
```

## Available Tools

- **get_repository** - Get repository information
- **list_repositories** - List user/org repositories  
- **create_repository** - Create new repository
- **list_issues** - List repository issues
- **create_issue** - Create new issue
- **list_pull_requests** - List pull requests
- **get_file_content** - Get file content from repository
- **search_repositories** - Search GitHub repositories

## Security Notes

- Never commit your `.env` file
- Use environment variables for all secrets
- Consider using GitHub App authentication for production
- Implement rate limiting for public deployments
- Use HTTPS in production

## Monitoring

The server includes:
- Health check endpoint: `/health`
- Tools listing: `/tools`
- Individual tool execution: `/tools/:toolName`

## Troubleshooting

### Common Issues
1. **401 Unauthorized** - Check GitHub token permissions
2. **Rate Limiting** - Implement exponential backoff
3. **CORS Issues** - Configure CORS_ORIGIN environment variable

### Debug Mode
```bash
DEBUG=* npm start -- --http
```
