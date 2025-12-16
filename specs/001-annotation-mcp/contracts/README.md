# MCP Tool Contracts

This directory contains JSON Schema definitions for all MCP tools provided by the Annotation MCP Server.

## Tools

| Tool Name | Purpose | Input | Output |
|-----------|---------|-------|--------|
| `start_session` | Initialize annotation session | Config file | Session ID + metadata |
| `annotate_chunk` | Annotate single chunk | Session ID + annotation data | Chunk annotation |
| `annotate_chunks` | Annotate multiple chunks (batch) | Session ID + array of annotations | Batch result (partial success) |
| `add_relation` | Define relation between chunks | Session ID + relation data | Confirmation |
| `get_progress` | Query annotation progress | Session ID | Progress statistics |
| `export_annotations` | Export annotation JSON | Session ID | Complete annotation JSON |

## Schema Format

All schemas follow the JSON Schema specification compatible with MCP `inputSchema` requirements.

## Usage in TypeScript

```typescript
import { zodToJsonSchema } from "zod-to-json-schema";
import { StartSessionInputSchema } from "./validation/schemas";

const inputSchema = zodToJsonSchema(StartSessionInputSchema, "StartSessionInput");

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "start_session",
    description: "Initialize a new annotation session",
    inputSchema
  }]
}));
```

## Error Responses

All tools return errors in this format when `isError: true`:

```json
{
  "type": "ErrorTypeName",
  "message": "Human-readable error message",
  "field": "optional-context-field",
  "validOptions": ["optional", "valid", "choices"]
}
```

Error types are defined in [data-model.md](../data-model.md#error-types).
