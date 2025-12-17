# Research: Annotation MCP Server

**Date**: 2025-12-16
**Purpose**: Resolve technical decisions and document best practices for TypeScript MCP server implementation

## Research Questions

1. Session ID generation: crypto.randomUUID() vs nanoid
2. TypeScript MCP server patterns and best practices
3. Zod schema design for Literal types and discriminated unions
4. In-memory session storage patterns with Map
5. Result/Either type patterns in TypeScript

---

## Decision 1: Session ID Generation

**Question**: Use crypto.randomUUID() (Node.js built-in) or nanoid (external library)?

**Research**:
- `crypto.randomUUID()`: Built-in since Node.js 14.17, generates RFC 4122 v4 UUIDs (128-bit)
- `nanoid`: External library, generates smaller IDs (21 chars default), more entropy per character

**Decision**: **crypto.randomUUID()**

**Rationale**:
- Zero dependencies (aligns with simplicity principle)
- 128-bit entropy is sufficient for single-session-per-conversation use case
- RFC 4122 standard, widely recognized format
- No collision risk at our scale (single LLM, short-lived sessions)
- Built-in = no supply chain risk

**Alternatives Considered**:
- nanoid: Rejected due to added dependency for marginal benefit
- Sequential IDs: Rejected due to predictability concerns
- UUIDs are readable in logs and debugging (vs base64 encoded IDs)

---

## Pattern 2: TypeScript MCP Server Structure

**Research**: Analyzed @modelcontextprotocol/sdk documentation and examples

**Best Practices**:

1. **Server Setup** (stdio transport):
   ```typescript
   import { Server } from "@modelcontextprotocol/sdk/server/index.js";
   import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

   const server = new Server({
     name: "annotation-mcp-server",
     version: "1.0.0"
   }, {
     capabilities: {
       tools: {}
     }
   });

   server.setRequestHandler(ListToolsRequestSchema, async () => ({
     tools: [/* tool definitions */]
   }));

   const transport = new StdioServerTransport();
   await server.connect(transport);
   ```

2. **Tool Handler Pattern**:
   ```typescript
   server.setRequestHandler(CallToolRequestSchema, async (request) => {
     const { name, arguments: args } = request.params;

     switch (name) {
       case "start_session":
         return handleStartSession(args);
       // ... other tools
     }
   });
   ```

3. **Type-Safe Tool Definitions**:
   - Use Zod schemas converted to JSON Schema for `inputSchema`
   - Return `{ content: [...], isError?: boolean }` from handlers
   - Errors: Protocol errors (unknown tool) vs tool execution errors (invalid input)

**Recommendation**: Follow SDK patterns exactly - no custom abstractions

---

## Pattern 3: Zod Schema Design

**Research**: Zod patterns for Literal types and type inference

**Best Practices**:

1. **Literal Union Types**:
   ```typescript
   import { z } from "zod";

   const CategorySchema = z.enum(["fee_schedule", "footnotes"]);
   type Category = z.infer<typeof CategorySchema>; // "fee_schedule" | "footnotes"
   ```

2. **Discriminated Unions**:
   ```typescript
   const ErrorSchema = z.discriminatedUnion("type", [
     z.object({ type: z.literal("InvalidSession"), sessionId: z.string() }),
     z.object({ type: z.literal("ValidationError"), field: z.string(), message: z.string() }),
     z.object({ type: z.literal("NotFound"), chunkId: z.string() })
   ]);
   ```

3. **Dependent Validation** (subtype → category):
   ```typescript
   const AnnotationSchema = z.object({
     category: CategorySchema,
     subtype: z.string()
   }).refine((data) => {
     if (data.category === "fee_schedule") {
       return FeeScheduleSubtypeSchema.safeParse(data.subtype).success;
     }
     return FootnotesSubtypeSchema.safeParse(data.subtype).success;
   }, { message: "Subtype must match category" });
   ```

4. **Zod to JSON Schema Conversion**:
   ```typescript
   import { zodToJsonSchema } from "zod-to-json-schema";

   const jsonSchema = zodToJsonSchema(AnnotationSchema, "AnnotationInput");
   ```

**Recommendation**: Define all types as Zod schemas first, infer TypeScript types from them

---

## Pattern 4: In-Memory Session Storage

**Research**: Map-based session storage with type safety

**Best Practices**:

1. **Session Manager Pattern**:
   ```typescript
   class SessionManager {
     private sessions = new Map<string, Session>();

     create(config: ConfigFile): Result<Session, CreateSessionError> {
       const sessionId = crypto.randomUUID();
       const session: Session = {
         id: sessionId,
         config,
         annotations: new Map(),
         createdAt: new Date(),
         lastAccessedAt: new Date()
       };
       this.sessions.set(sessionId, session);
       return { success: true, data: session };
     }

     get(sessionId: string): Result<Session, SessionNotFoundError> {
       const session = this.sessions.get(sessionId);
       if (!session) {
         return { success: false, error: { type: "SessionNotFound", sessionId } };
       }
       session.lastAccessedAt = new Date();
       return { success: true, data: session };
     }
   }
   ```

2. **Memory Management**:
   - No automatic cleanup for MVP (sessions live until server restart)
   - Future: Add TTL-based cleanup with setInterval (deferred to avoid premature optimization)

3. **Singleton Instance**:
   ```typescript
   // session/session-manager.ts
   export const sessionManager = new SessionManager();
   ```

**Recommendation**: Simple Map with singleton pattern, no cleanup for v1

---

## Pattern 5: Result/Either Type Pattern

**Research**: TypeScript Result type for error handling

**Best Practices**:

1. **Result Type Definition**:
   ```typescript
   type Success<T> = { success: true; data: T };
   type Failure<E> = { success: false; error: E };
   type Result<T, E> = Success<T> | Failure<E>;
   ```

2. **Error Types**:
   ```typescript
   type SessionError =
     | { type: "SessionNotFound"; sessionId: string }
     | { type: "InvalidConfig"; issues: ZodIssue[] };

   type AnnotationError =
     | { type: "InvalidCategory"; category: string; validOptions: string[] }
     | { type: "ChunkNotFound"; chunkId: string };
   ```

3. **Usage Pattern**:
   ```typescript
   function annotateChunk(sessionId: string, annotation: Annotation): Result<ChunkAnnotation, AnnotationError> {
     const sessionResult = sessionManager.get(sessionId);
     if (!sessionResult.success) {
       return sessionResult; // propagate error
     }

     const validation = AnnotationSchema.safeParse(annotation);
     if (!validation.success) {
       return {
         success: false,
         error: { type: "ValidationError", issues: validation.error.issues }
       };
     }

     // happy path
     return { success: true, data: savedAnnotation };
   }
   ```

4. **MCP Tool Integration**:
   ```typescript
   async function handleAnnotateChunk(args: unknown) {
     const result = annotateChunk(args.sessionId, args.annotation);

     if (!result.success) {
       return {
         content: [{ type: "text", text: JSON.stringify(result.error) }],
         isError: true
       };
     }

     return {
       content: [{ type: "text", text: JSON.stringify(result.data) }]
     };
   }
   ```

**Recommendation**: Use Result pattern throughout, convert to MCP response format at tool boundary

---

## Dependencies

Based on research, final dependency list:

**Runtime**:
- `@modelcontextprotocol/sdk`: ^1.0.0 (MCP protocol implementation)
- `zod`: ^3.22.0 (schema validation + type inference)
- `pino`: ^8.16.0 (structured logging)
- `zod-to-json-schema`: ^3.22.0 (Zod → JSON Schema conversion for MCP tool schemas)

**Development**:
- `typescript`: ^5.3.0
- `vitest`: ^1.0.0 (test framework)
- `@types/node`: ^20.0.0

**Justification**:
- All dependencies serve specific, irreplaceable purposes
- No redundancy (single logger, single validator, single test framework)
- Minimal surface area for supply chain attacks
- Well-maintained, industry-standard libraries

---

## Summary

All NEEDS CLARIFICATION items resolved:

1. ✅ Session ID: Use crypto.randomUUID() (built-in, simple, sufficient)
2. ✅ MCP patterns: Follow SDK examples exactly (no abstractions)
3. ✅ Zod design: Schema-first with Literal enums and discriminated unions
4. ✅ Storage: Map-based singleton with Result pattern
5. ✅ Error handling: Result type with discriminated error unions

**Ready for Phase 1**: Data model design and contract generation
