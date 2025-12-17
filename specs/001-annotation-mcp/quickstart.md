# Quickstart: Annotation MCP Server

**Purpose**: Get the annotation MCP server running and perform a basic annotation workflow

## Prerequisites

- Node.js 20 LTS or higher
- npm or pnpm

## Installation

```bash
# Clone and install dependencies
cd annotation-mcp
npm install

# Build TypeScript
npm run build

# Run tests
npm test
```

## Basic Annotation Workflow

### 1. Start the MCP Server

The server runs on stdio transport (designed for MCP clients like Claude Desktop):

```bash
node dist/index.js
```

Or during development with auto-reload:

```bash
npm run dev
```

### 2. Connect from MCP Client

**Claude Desktop Configuration** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "annotation": {
      "command": "node",
      "args": ["/absolute/path/to/annotation-mcp/dist/index.js"]
    }
  }
}
```

### 3. Annotation Workflow Example

**Step 1: Prepare Config File**

Create a config file with document chunks:

```json
{
  "chunks": [
    {
      "chunk_id": "chunk_0",
      "position": 0,
      "text": "Section I: Participant Fees\n\nInitiation Fee: $2,500 (one-time payment)"
    },
    {
      "chunk_id": "chunk_1",
      "position": 1,
      "text": "Monthly Participant Fee: $1,500 per month"
    },
    {
      "chunk_id": "chunk_footnote_1",
      "position": 2,
      "text": "Note 1: Fees subject to change with 30 days notice"
    }
  ]
}
```

**Step 2: Start Session**

Use the `start_session` tool:

```typescript
// MCP tool call
{
  "name": "start_session",
  "arguments": {
    "config": { /* config file from above */ }
  }
}

// Response:
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "chunkCount": 3,
  "message": "Session created successfully"
}
```

**Step 3: Annotate Chunks**

Annotate individual chunks or use batch:

```typescript
// Single chunk annotation
{
  "name": "annotate_chunk",
  "arguments": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "chunkId": "chunk_0",
    "categories": ["fee_schedule"],
    "labels": ["Fee Schedule"],
    "subtypes": {
      "fee_schedule": "participant_fee"
    },
    "tags": ["initiation", "one-time"],
    "summary": "One-time initiation fee of $2,500"
  }
}

// Batch annotation (multiple chunks)
{
  "name": "annotate_chunks",
  "arguments": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "annotations": [
      {
        "chunkId": "chunk_1",
        "categories": ["fee_schedule"],
        "labels": ["Fee Schedule"],
        "subtypes": { "fee_schedule": "participant_fee" },
        "tags": ["monthly", "recurring"],
        "summary": "Monthly recurring fee of $1,500"
      },
      {
        "chunkId": "chunk_footnote_1",
        "categories": ["footnotes"],
        "labels": ["Footnotes"],
        "subtypes": { "footnotes": "reference" },
        "summary": "Fee change notice period"
      }
    ]
  }
}

// Batch response (partial success):
{
  "results": [
    { "chunkId": "chunk_1", "success": true, "data": {...} },
    { "chunkId": "chunk_footnote_1", "success": true, "data": {...} }
  ],
  "successCount": 2,
  "errorCount": 0
}
```

**Step 4: Add Relations**

Define relationships between chunks:

```typescript
{
  "name": "add_relation",
  "arguments": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "sourceChunkId": "chunk_0",
    "targetChunkId": "chunk_footnote_1",
    "relationType": "footnotes"
  }
}
```

**Step 5: Check Progress**

```typescript
{
  "name": "get_progress",
  "arguments": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000"
  }
}

// Response:
{
  "totalChunks": 3,
  "annotatedChunks": 3,
  "pendingChunks": 0,
  "completionPercentage": 100,
  "pendingChunkIds": []
}
```

**Step 6: Export Annotations**

```typescript
{
  "name": "export_annotations",
  "arguments": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000"
  }
}

// Response: Complete annotation JSON
{
  "chunks": [
    {
      "chunk_id": "0_fee_schedule_Fee Schedule",
      "position": 0,
      "categories": ["fee_schedule"],
      "labels": ["Fee Schedule"],
      "subtypes": { "fee_schedule": "participant_fee" },
      "keywords": [],
      "tags": ["initiation", "one-time"],
      "relations": { "footnotes": ["chunk_footnote_1"] },
      "notes": "",
      "summary": "One-time initiation fee of $2,500"
    },
    // ... more chunks
  ]
}
```

## Common Error Scenarios

### Invalid Category

```typescript
// Request with invalid category
{
  "name": "annotate_chunk",
  "arguments": {
    "sessionId": "...",
    "chunkId": "chunk_0",
    "categories": ["invalid_category"]  // ❌ Not in allowed Literals
  }
}

// Error response:
{
  "type": "InvalidCategory",
  "category": "invalid_category",
  "validOptions": ["fee_schedule", "footnotes"],
  "message": "Invalid category. Valid options: fee_schedule, footnotes"
}
```

### Subtype-Category Mismatch

```typescript
// Request with wrong subtype for category
{
  "name": "annotate_chunk",
  "arguments": {
    "sessionId": "...",
    "chunkId": "chunk_0",
    "categories": ["footnotes"],
    "subtypes": {
      "footnotes": "participant_fee"  // ❌ This is a fee_schedule subtype
    }
  }
}

// Error response:
{
  "type": "InvalidSubtype",
  "subtype": "participant_fee",
  "category": "footnotes",
  "validOptions": ["reference"],
  "message": "Invalid subtype for footnotes. Valid options: reference"
}
```

### Session Not Found

```typescript
{
  "name": "annotate_chunk",
  "arguments": {
    "sessionId": "non-existent-uuid",  // ❌ Invalid session
    "chunkId": "chunk_0"
  }
}

// Error response:
{
  "type": "SessionNotFound",
  "sessionId": "non-existent-uuid",
  "message": "Session not found"
}
```

## Development Commands

```bash
# Run in development mode with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type check
npm run type-check

# Lint
npm run lint

# Format code
npm run format
```

## Troubleshooting

### Server not appearing in Claude Desktop

1. Check config file path is absolute
2. Verify `node` is in PATH
3. Check server logs: `tail -f ~/Library/Logs/Claude/mcp-server-annotation.log`
4. Restart Claude Desktop after config changes

### Session lost

Sessions are in-memory only. If the server restarts, you must create a new session.

### Type errors

All category, label, subtype, and relation values must match exact Literal strings. Check [data-model.md](./data-model.md#literal-types) for valid values.

## Next Steps

- Read [data-model.md](./data-model.md) for complete type definitions
- Review [contracts/tool-schemas.md](./contracts/tool-schemas.md) for all tool schemas
- See [plan.md](./plan.md) for architecture decisions
