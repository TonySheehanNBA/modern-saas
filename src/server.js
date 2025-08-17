#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Octokit } from '@octokit/rest';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

class GitHubMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'github-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_repository',
            description: 'Get information about a GitHub repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner (username or organization)',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name',
                },
              },
              required: ['owner', 'repo'],
            },
          },
          {
            name: 'list_repositories',
            description: 'List repositories for a user or organization',
            inputSchema: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  description: 'GitHub username or organization name',
                },
                type: {
                  type: 'string',
                  enum: ['all', 'owner', 'public', 'private', 'member'],
                  description: 'Repository type filter',
                  default: 'all',
                },
                per_page: {
                  type: 'number',
                  description: 'Number of repositories per page (max 100)',
                  default: 30,
                },
              },
              required: ['username'],
            },
          },
          {
            name: 'create_repository',
            description: 'Create a new GitHub repository',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Repository name',
                },
                description: {
                  type: 'string',
                  description: 'Repository description',
                },
                private: {
                  type: 'boolean',
                  description: 'Whether the repository should be private',
                  default: false,
                },
                auto_init: {
                  type: 'boolean',
                  description: 'Whether to initialize with README',
                  default: true,
                },
              },
              required: ['name'],
            },
          },
          {
            name: 'list_issues',
            description: 'List issues for a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name',
                },
                state: {
                  type: 'string',
                  enum: ['open', 'closed', 'all'],
                  description: 'Issue state filter',
                  default: 'open',
                },
                per_page: {
                  type: 'number',
                  description: 'Number of issues per page (max 100)',
                  default: 30,
                },
              },
              required: ['owner', 'repo'],
            },
          },
          {
            name: 'create_issue',
            description: 'Create a new issue in a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name',
                },
                title: {
                  type: 'string',
                  description: 'Issue title',
                },
                body: {
                  type: 'string',
                  description: 'Issue body/description',
                },
                labels: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Labels to assign to the issue',
                },
              },
              required: ['owner', 'repo', 'title'],
            },
          },
          {
            name: 'list_pull_requests',
            description: 'List pull requests for a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name',
                },
                state: {
                  type: 'string',
                  enum: ['open', 'closed', 'all'],
                  description: 'Pull request state filter',
                  default: 'open',
                },
                per_page: {
                  type: 'number',
                  description: 'Number of pull requests per page (max 100)',
                  default: 30,
                },
              },
              required: ['owner', 'repo'],
            },
          },
          {
            name: 'get_file_content',
            description: 'Get the content of a file from a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name',
                },
                path: {
                  type: 'string',
                  description: 'File path in the repository',
                },
                ref: {
                  type: 'string',
                  description: 'Branch, tag, or commit SHA (defaults to default branch)',
                },
              },
              required: ['owner', 'repo', 'path'],
            },
          },
          {
            name: 'search_repositories',
            description: 'Search for repositories on GitHub',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query',
                },
                sort: {
                  type: 'string',
                  enum: ['stars', 'forks', 'help-wanted-issues', 'updated'],
                  description: 'Sort field',
                },
                order: {
                  type: 'string',
                  enum: ['asc', 'desc'],
                  description: 'Sort order',
                  default: 'desc',
                },
                per_page: {
                  type: 'number',
                  description: 'Number of results per page (max 100)',
                  default: 30,
                },
              },
              required: ['query'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_repository':
            return await this.getRepository(args);
          case 'list_repositories':
            return await this.listRepositories(args);
          case 'create_repository':
            return await this.createRepository(args);
          case 'list_issues':
            return await this.listIssues(args);
          case 'create_issue':
            return await this.createIssue(args);
          case 'list_pull_requests':
            return await this.listPullRequests(args);
          case 'get_file_content':
            return await this.getFileContent(args);
          case 'search_repositories':
            return await this.searchRepositories(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async getRepository(args) {
    const { owner, repo } = args;
    const response = await this.octokit.rest.repos.get({ owner, repo });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  async listRepositories(args) {
    const { username, type = 'all', per_page = 30 } = args;
    const response = await this.octokit.rest.repos.listForUser({
      username,
      type,
      per_page,
    });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  async createRepository(args) {
    const { name, description, private: isPrivate = false, auto_init = true } = args;
    const response = await this.octokit.rest.repos.createForAuthenticatedUser({
      name,
      description,
      private: isPrivate,
      auto_init,
    });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  async listIssues(args) {
    const { owner, repo, state = 'open', per_page = 30 } = args;
    const response = await this.octokit.rest.issues.listForRepo({
      owner,
      repo,
      state,
      per_page,
    });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  async createIssue(args) {
    const { owner, repo, title, body, labels } = args;
    const response = await this.octokit.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
    });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  async listPullRequests(args) {
    const { owner, repo, state = 'open', per_page = 30 } = args;
    const response = await this.octokit.rest.pulls.list({
      owner,
      repo,
      state,
      per_page,
    });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  async getFileContent(args) {
    const { owner, repo, path, ref } = args;
    const response = await this.octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  async searchRepositories(args) {
    const { query, sort, order = 'desc', per_page = 30 } = args;
    const response = await this.octokit.rest.search.repos({
      q: query,
      sort,
      order,
      per_page,
    });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('GitHub MCP server running on stdio');
  }

  async runHTTP() {
    const app = express();
    const port = process.env.PORT || 3000;

    app.use(cors({
      origin: process.env.CORS_ORIGIN || '*'
    }));
    app.use(express.json());

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'healthy', server: 'github-mcp-server' });
    });

    // MCP tools endpoint
    app.get('/tools', async (req, res) => {
      try {
        const tools = await this.server.request(
          { method: 'tools/list' },
          ListToolsRequestSchema
        );
        res.json(tools);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // MCP tool execution endpoint
    app.post('/tools/:toolName', async (req, res) => {
      try {
        const result = await this.server.request(
          {
            method: 'tools/call',
            params: {
              name: req.params.toolName,
              arguments: req.body,
            },
          },
          CallToolRequestSchema
        );
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.listen(port, () => {
      console.log(`GitHub MCP Server running on http://localhost:${port}`);
    });
  }
}

// Run the server
const server = new GitHubMCPServer();

if (process.argv.includes('--http')) {
  server.runHTTP();
} else {
  server.run();
}
