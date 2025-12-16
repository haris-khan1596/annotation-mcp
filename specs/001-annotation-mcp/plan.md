# Implementation Plan: Annotation MCP Server

**Branch**: `001-annotation-mcp` | **Date**: 2025-12-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-annotation-mcp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build an MCP server that enables LLMs to generate consistent annotation JSON from document chunks. The server provides session-based annotation tools with strict type validation using Literal types, supporting both single and batch operations. Core features: session initialization, chunk annotation with categories/subtypes/relations, progress tracking, and JSON export. Architecture prioritizes simplicity and type safety per constitution principles.

## Technical Context

**Language/Version**: TypeScript 5.3+ (Node.js 20 LTS)
**Primary Dependencies**: @modelcontextprotocol/sdk, zod (schema validation)
**Storage**: In-memory only (Map-based session store); architecture allows future persistence
**Testing**: Vitest (unit + integration), @modelcontextprotocol/sdk test utilities
**Target Platform**: Node.js 20+ (cross-platform: macOS, Linux, Windows)
**Project Type**: Single (MCP server - stdio transport)
**Performance Goals**: <2s response time for operations on 100-chunk documents
**Constraints**: <200ms p95 latency for single-chunk operations, <50MB memory for 100-chunk session
**Scale/Scope**: Single-session per LLM conversation, documents up to 500 chunks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Type Safety First
- ✅ TypeScript with strict mode enabled
- ✅ Zod schemas for runtime validation + type inference
- ✅ Literal types for categories, subtypes, relation types (no string enums)
- ✅ Discriminated unions for error types
- ✅ All MCP tool parameters and responses fully typed

### II. Simplicity Over Cleverness (NON-NEGOTIABLE)
- ✅ In-memory Map for session storage (no database)
- ✅ Single MCP server (no microservices)
- ✅ Direct session manager (no ORM, no repository pattern)
- ✅ Feature-based organization (not layered architecture)
- ⚠️ **DECISION NEEDED**: Session ID generation - use crypto.randomUUID() (simple) vs nanoid (more entropy)

### III. Error Handling as First-Class Design
- ✅ Result type pattern for all operations that can fail
- ✅ Discriminated union of error types exported from types/
- ✅ Partial success handling in batch operations
- ✅ Input validation at MCP tool boundary using Zod

### IV. Observable Operations
- ✅ Structured JSON logging with pino
- ✅ Log all MCP tool invocations (tool name, session_id, success/error)
- ✅ Performance timing for operations >100ms
- ✅ No PII in logs (chunk text content excluded, only IDs logged)

### V. Contract-Driven Development
- ✅ MCP tool schemas with explicit inputSchema
- ✅ Zod validation before any business logic
- ✅ JSON Schema contracts in /contracts/ for documentation
- ✅ Export formats validated against schema before returning

**Gates Status**: PASS (pending Session ID decision - low complexity impact)

## Project Structure

### Documentation (this feature)

```text
specs/001-annotation-mcp/
├── plan.md              # This file
├── research.md          # Phase 0: TypeScript MCP patterns, Zod validation, session management
├── data-model.md        # Phase 1: Session, ChunkAnnotation, Config models
├── quickstart.md        # Phase 1: Setup, basic annotation workflow example
└── contracts/           # Phase 1: MCP tool schemas (JSON Schema + OpenAPI format)
    ├── start-session.json
    ├── annotate-chunk.json
    ├── annotate-chunks.json
    ├── add-relation.json
    ├── get-progress.json
    └── export-annotations.json
```

### Source Code (repository root)

```text
src/
├── types/
│   ├── annotation.types.ts      # ChunkAnnotation, AnnotationExport, Literals
│   ├── session.types.ts          # Session, SessionState
│   ├── config.types.ts           # ConfigFile, ConfigChunk
│   ├── result.types.ts           # Result<T, E>, Success, Failure unions
│   └── error.types.ts            # ErrorType discriminated union
├── session/
│   ├── session-manager.ts        # In-memory session CRUD
│   └── session-validator.ts      # Session existence, expiry checks
├── annotation/
│   ├── annotation-service.ts     # Core annotation logic
│   ├── batch-processor.ts        # Partial success batch handling
│   └── relation-manager.ts       # Relation graph validation
├── validation/
│   ├── schemas.ts                # Zod schemas for all types
│   └── literal-validators.ts    # Category/subtype/relation validation
├── mcp/
│   ├── server.ts                 # MCP server setup (stdio transport)
│   └── tools/
│       ├── start-session.ts
│       ├── annotate-chunk.ts
│       ├── annotate-chunks.ts
│       ├── add-relation.ts
│       ├── get-progress.ts
│       └── export-annotations.ts
├── utils/
│   └── logger.ts                 # Pino structured logger
└── index.ts                      # Entry point

tests/
├── unit/
│   ├── session-manager.test.ts
│   ├── annotation-service.test.ts
│   ├── batch-processor.test.ts
│   └── validation.test.ts
├── integration/
│   ├── mcp-protocol.test.ts      # MCP tool contract tests
│   └── workflow.test.ts          # Full annotation workflow
└── fixtures/
    ├── valid-config.json
    ├── invalid-config.json
    └── expected-output.json
```

**Structure Decision**: Single project (MCP server) - matches constitution's simplicity principle. Feature-based grouping (session/, annotation/, validation/) over layered architecture. Types centralized in types/ for easy import. MCP tools isolated in mcp/tools/ for clear separation.

## Complexity Tracking

No constitution violations requiring justification. All complexity choices align with simplicity principle:
- In-memory storage: Simplest persistence model
- Zod over custom validation: Industry-standard, type-safe
- Pino over Winston: Lighter-weight, better performance
- Feature grouping: More discoverable than layers
