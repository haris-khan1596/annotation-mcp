import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createLogger } from '../utils/logger.js';

// Import tool definitions and handlers
import {
  startSessionToolDefinition,
  handleStartSession,
} from './tools/start-session.js';
import {
  annotateChunkToolDefinition,
  handleAnnotateChunk,
} from './tools/annotate-chunk.js';
import {
  annotateChunksToolDefinition,
  handleAnnotateChunks,
} from './tools/annotate-chunks.js';
import {
  addRelationToolDefinition,
  handleAddRelation,
} from './tools/add-relation.js';
import {
  getProgressToolDefinition,
  handleGetProgress,
} from './tools/get-progress.js';
import {
  exportAnnotationsToolDefinition,
  handleExportAnnotations,
} from './tools/export-annotations.js';

const logger = createLogger('mcp-server');

// Create the MCP server
export const server = new Server(
  {
    name: 'annotation-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register ListTools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.debug('ListTools request received');
  return {
    tools: [
      startSessionToolDefinition,
      annotateChunkToolDefinition,
      annotateChunksToolDefinition,
      addRelationToolDefinition,
      getProgressToolDefinition,
      exportAnnotationsToolDefinition,
    ],
  };
});

// Register CallTool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  logger.info({ tool: name }, 'CallTool request received');

  const startTime = Date.now();

  try {
    let result;

    switch (name) {
      case 'start_session':
        result = handleStartSession(args);
        break;
      case 'annotate_chunk':
        result = handleAnnotateChunk(args);
        break;
      case 'annotate_chunks':
        result = handleAnnotateChunks(args);
        break;
      case 'add_relation':
        result = handleAddRelation(args);
        break;
      case 'get_progress':
        result = handleGetProgress(args);
        break;
      case 'export_annotations':
        result = handleExportAnnotations(args);
        break;
      default:
        logger.warn({ tool: name }, 'Unknown tool requested');
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                type: 'UnknownTool',
                tool: name,
                message: `Unknown tool: ${name}`,
              }),
            },
          ],
          isError: true,
        };
    }

    const duration = Date.now() - startTime;
    logger.info({ tool: name, duration, success: !result.isError }, 'Tool execution completed');

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error({ tool: name, duration, error }, 'Tool execution failed with exception');

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            type: 'InternalError',
            message: error instanceof Error ? error.message : 'Unknown error',
          }),
        },
      ],
      isError: true,
    };
  }
});

// Start the server with stdio transport
export async function startServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('MCP server started with stdio transport');
}
