# Annotation MCP Server

A Model Context Protocol (MCP) server for document chunk annotation. Enables LLMs to generate consistent annotation JSON from document chunks with strict type validation.

## Features

- **Session Management**: Create annotation sessions with config files containing document chunks
- **Chunk Annotation**: Annotate chunks with categories, subtypes, labels, keywords, tags, and summaries
- **Batch Operations**: Annotate multiple chunks in a single call with partial success semantics
- **Relations**: Define directed relations between chunks (dependencies, footnotes, references)
- **Progress Tracking**: Query annotation progress and pending chunks
- **Export**: Export complete annotation JSON for the session

## Installation

```bash
npm install
npm run build
```

## Usage

### Running the Server

```bash
npm start
```

Or during development:

```bash
npm run dev
```

### Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

## Available Tools

### start_session

Initialize a new annotation session with a config file.

**Input:**
```json
{
  "config": {
    "chunks": [
      { "chunk_id": "chunk_0", "position": 0, "text": "..." },
      { "chunk_id": "chunk_1", "position": 1, "text": "..." }
    ]
  }
}
```

### annotate_chunk

Annotate a single chunk with categories, subtypes, and metadata.

**Input:**
```json
{
  "sessionId": "uuid",
  "chunkId": "chunk_0",
  "categories": ["fee_schedule"],
  "labels": ["Fee Schedule"],
  "subtypes": { "fee_schedule": "participant_fee" },
  "tags": ["important"],
  "summary": "Description of chunk"
}
```

### annotate_chunks

Annotate multiple chunks in a single call (partial success semantics).

### add_relation

Define a directed relation between two chunks.

**Input:**
```json
{
  "sessionId": "uuid",
  "sourceChunkId": "chunk_0",
  "targetChunkId": "chunk_1",
  "relationType": "footnotes"
}
```

### get_progress

Query annotation progress for a session.

### export_annotations

Export complete annotation JSON for the session.

## Valid Literal Values

### Categories
- `fee_schedule`
- `footnotes`

### Labels
- `Fee Schedule`
- `Footnotes`

### Fee Schedule Subtypes
- `participant_fee`
- `legal_regulatory_fee`
- `port_fees_and_other_services`
- `market_data_fees`
- `fees_and_rebates`

### Footnotes Subtypes
- `reference`

### Relation Types
- `dependencies`
- `footnotes`
- `references`

## Development

```bash
# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint

# Format code
npm run format
```

## Architecture

- **In-memory storage**: Sessions are stored in memory and lost on server restart
- **Type-safe**: Full TypeScript with strict mode and Zod validation
- **Result pattern**: All operations return Result types for explicit error handling
- **Structured logging**: JSON logging with Pino

## License

ISC
