# Tasks: Annotation MCP Server

**Input**: Design documents from `/specs/001-annotation-mcp/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - only included if explicitly requested in the feature specification. This feature does NOT explicitly request tests, so test tasks are excluded.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below assume single project - matches plan.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Initialize Node.js project with TypeScript 5.3+ configuration in package.json
- [X] T002 [P] Configure tsconfig.json with strict mode and target ES2022
- [X] T003 [P] Install dependencies: @modelcontextprotocol/sdk, zod, pino, zod-to-json-schema
- [X] T004 [P] Install dev dependencies: typescript, vitest, @types/node
- [X] T005 [P] Create src/ directory structure per plan.md (types/, session/, annotation/, validation/, mcp/, utils/)
- [X] T006 [P] Create .gitignore with node_modules, dist/, .env
- [X] T007 [P] Configure ESLint and Prettier for TypeScript
- [X] T008 [P] Setup build scripts in package.json (build, dev, test)

**Checkpoint**: Basic project scaffolding complete

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T009 Create Literal type schemas (Category, Label, Subtype, RelationType) in src/types/annotation.types.ts
- [X] T010 [P] Create Result type definitions (Success, Failure, Result) in src/types/result.types.ts
- [X] T011 [P] Create error type discriminated unions (SessionError, AnnotationError, RelationError) in src/types/error.types.ts
- [X] T012 [P] Create ConfigChunkSchema and ConfigFileSchema in src/types/config.types.ts
- [X] T013 [P] Create ChunkAnnotationSchema and AnnotationExportSchema in src/types/annotation.types.ts
- [X] T014 [P] Create SessionSchema and SessionStateSchema in src/types/session.types.ts
- [X] T015 Create Zod schema consolidation file in src/validation/schemas.ts
- [X] T016 [P] Implement category-subtype validation function in src/validation/literal-validators.ts
- [X] T017 [P] Create Pino logger configuration in src/utils/logger.ts
- [X] T018 [P] Create BatchAnnotationResultSchema in src/types/annotation.types.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Initialize Annotation Session (Priority: P1) 🎯 MVP

**Goal**: LLM can start annotation session with config file validation and state tracking

**Independent Test**: Provide valid/invalid config files and verify sessions created with proper error handling

### Implementation for User Story 1

- [X] T019 [P] [US1] Create SessionManager class with in-memory Map storage in src/session/session-manager.ts
- [X] T020 [P] [US1] Create session validation helper in src/session/session-validator.ts
- [X] T021 [US1] Implement SessionManager.create() with config validation and duplicate chunk_id detection in src/session/session-manager.ts
- [X] T022 [US1] Implement SessionManager.get() with Result pattern in src/session/session-manager.ts
- [X] T023 [US1] Create start_session MCP tool handler in src/mcp/tools/start-session.ts
- [X] T024 [US1] Convert Zod schemas to JSON Schema for start_session inputSchema in src/mcp/tools/start-session.ts
- [X] T025 [US1] Implement MCP error response formatting for session errors in src/mcp/tools/start-session.ts
- [X] T026 [US1] Add structured logging for session creation in src/mcp/tools/start-session.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Add Annotations to Chunks (Priority: P1) 🎯 MVP

**Goal**: LLM can annotate chunks with categories/subtypes/metadata using single or batch operations

**Independent Test**: Start session, annotate chunks (single + batch), verify annotations recorded with Literal validation

### Implementation for User Story 2

- [X] T027 [P] [US2] Create AnnotationService class in src/annotation/annotation-service.ts
- [X] T028 [US2] Implement AnnotationService.annotateChunk() with Literal validation in src/annotation/annotation-service.ts
- [X] T029 [US2] Implement category-subtype matching validation in src/annotation/annotation-service.ts
- [X] T030 [US2] Implement duplicate annotation update logic (not insert) in src/annotation/annotation-service.ts
- [X] T031 [P] [US2] Create BatchProcessor class in src/annotation/batch-processor.ts
- [X] T032 [US2] Implement BatchProcessor.annotateChunks() with partial success semantics in src/annotation/batch-processor.ts
- [X] T033 [US2] Implement per-chunk success/error aggregation in src/annotation/batch-processor.ts
- [X] T034 [US2] Create annotate_chunk MCP tool handler in src/mcp/tools/annotate-chunk.ts
- [X] T035 [US2] Create annotate_chunks MCP tool handler in src/mcp/tools/annotate-chunks.ts
- [X] T036 [US2] Convert annotation schemas to JSON Schema for tool inputSchemas in src/mcp/tools/annotate-chunk.ts
- [X] T037 [US2] Add structured logging for annotation operations in src/mcp/tools/annotate-chunk.ts and src/mcp/tools/annotate-chunks.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 4 - Export Annotation JSON (Priority: P1) 🎯 MVP

**Goal**: LLM can export complete annotation JSON with schema validation

**Independent Test**: Complete annotations, export JSON, validate against AnnotationExportSchema

### Implementation for User Story 4

- [X] T038 [P] [US4] Create export service in src/annotation/annotation-service.ts
- [X] T039 [US4] Implement AnnotationService.exportAnnotations() with schema validation in src/annotation/annotation-service.ts
- [X] T040 [US4] Implement handling of un-annotated chunks (marked as pending) in src/annotation/annotation-service.ts
- [X] T041 [US4] Create export_annotations MCP tool handler in src/mcp/tools/export-annotations.ts
- [X] T042 [US4] Convert export schema to JSON Schema for tool inputSchema in src/mcp/tools/export-annotations.ts
- [X] T043 [US4] Add structured logging for export operations in src/mcp/tools/export-annotations.ts

**Checkpoint**: At this point, User Stories 1, 2, AND 4 form a complete annotation workflow (MVP)

---

## Phase 6: User Story 3 - Define Relations Between Chunks (Priority: P2)

**Goal**: LLM can define directed relations between chunks with validation

**Independent Test**: Create session, annotate chunks, add relations, verify relation graph and target validation

### Implementation for User Story 3

- [X] T044 [P] [US3] Create RelationManager class in src/annotation/relation-manager.ts
- [X] T045 [US3] Implement RelationManager.addRelation() with target existence validation in src/annotation/relation-manager.ts
- [X] T046 [US3] Implement RelationManager.validateRelationType() with Literal check in src/annotation/relation-manager.ts
- [X] T047 [US3] Create add_relation MCP tool handler in src/mcp/tools/add-relation.ts
- [X] T048 [US3] Convert relation schemas to JSON Schema for tool inputSchema in src/mcp/tools/add-relation.ts
- [X] T049 [US3] Add structured logging for relation operations in src/mcp/tools/add-relation.ts

**Checkpoint**: All user stories 1-4 plus relations should now be independently functional

---

## Phase 7: User Story 5 - Query Annotation Progress (Priority: P3)

**Goal**: LLM can query annotation progress statistics

**Independent Test**: Partially annotate document, query progress, verify counts and pending chunk IDs

### Implementation for User Story 5

- [X] T050 [P] [US5] Create progress tracker in src/session/session-manager.ts
- [X] T051 [US5] Implement SessionManager.getProgress() with completion statistics in src/session/session-manager.ts
- [X] T052 [US5] Implement pending chunk ID collection in src/session/session-manager.ts
- [X] T053 [US5] Create get_progress MCP tool handler in src/mcp/tools/get-progress.ts
- [X] T054 [US5] Convert progress schemas to JSON Schema for tool inputSchema in src/mcp/tools/get-progress.ts
- [X] T055 [US5] Add structured logging for progress queries in src/mcp/tools/get-progress.ts

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: MCP Server Integration

**Purpose**: Wire all tools into MCP server with protocol compliance

- [X] T056 Create MCP Server instance with stdio transport in src/mcp/server.ts
- [X] T057 Register all 6 tool handlers (start_session, annotate_chunk, annotate_chunks, add_relation, get_progress, export_annotations) in src/mcp/server.ts
- [X] T058 Implement ListToolsRequestSchema handler with all tool definitions in src/mcp/server.ts
- [X] T059 Implement CallToolRequestSchema handler with tool routing in src/mcp/server.ts
- [X] T060 Add global error handling for unknown tools in src/mcp/server.ts
- [X] T061 Create main entry point in src/index.ts that starts MCP server
- [X] T062 Add server startup logging and graceful shutdown in src/index.ts

**Checkpoint**: MCP server fully functional with all user stories integrated

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T063 [P] Create README.md with setup and usage instructions
- [X] T064 [P] Add inline JSDoc comments for all public APIs
- [X] T065 [P] Verify all error messages are actionable for LLMs (include validOptions in errors)
- [X] T066 [P] Add performance timing logs for operations >100ms
- [X] T067 Code cleanup: remove any unused imports and console.logs
- [X] T068 Verify strict TypeScript compliance (no `any` without justification)
- [X] T069 Add examples directory with sample config file and workflow
- [X] T070 Run quickstart.md validation manually (test end-to-end workflow)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - User Story 1 (Phase 3): Can start after Foundational - No dependencies on other stories
  - User Story 2 (Phase 4): Can start after Foundational - Depends on US1 (needs session from US1)
  - User Story 4 (Phase 5): Can start after Foundational - Depends on US1 + US2 (needs session + annotations)
  - User Story 3 (Phase 6): Can start after Foundational - Depends on US1 + US2 (needs session + annotations)
  - User Story 5 (Phase 7): Can start after Foundational - Depends on US1 + US2 (needs session + annotations)
- **MCP Integration (Phase 8)**: Depends on all user story implementations
- **Polish (Phase 9)**: Depends on MCP Integration

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Depends on US1 (requires session management) - Should be implemented sequentially after US1
- **User Story 4 (P1)**: Depends on US1 + US2 (requires session + annotations) - Should be implemented sequentially after US2
- **User Story 3 (P2)**: Depends on US1 + US2 (requires session + annotations) - Can run in parallel with US4 if team capacity allows
- **User Story 5 (P3)**: Depends on US1 + US2 (requires session + annotations) - Can run in parallel with US3/US4 if team capacity allows

### Within Each User Story

- Schemas before services (types must exist before business logic)
- Services before MCP tools (business logic before API)
- Core implementation before logging/error handling enhancements

### Parallel Opportunities

- **Setup Phase**: All tasks marked [P] can run in parallel (T002-T008)
- **Foundational Phase**: All tasks marked [P] can run in parallel (T010-T014, T016-T018)
- **User Story Phases**: Tasks marked [P] within each story can run in parallel
  - US1: T019-T020 can run in parallel
  - US2: T027 and T031 can run in parallel
  - US3: T044 standalone (small story, no parallelism)
  - US4: T038 standalone
  - US5: T050 standalone
- **Polish Phase**: All tasks marked [P] can run in parallel (T063-T066)

---

## Parallel Example: User Story 2

```bash
# Launch parallel tasks for User Story 2:
Task: "Create AnnotationService class in src/annotation/annotation-service.ts" (T027)
Task: "Create BatchProcessor class in src/annotation/batch-processor.ts" (T031)

# Then sequential tasks after both complete:
Task: "Implement AnnotationService.annotateChunk()..." (T028-T030)
Task: "Implement BatchProcessor.annotateChunks()..." (T032-T033)
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 4 Only)

1. Complete Phase 1: Setup (T001-T008)
2. Complete Phase 2: Foundational (T009-T018) - **CRITICAL - blocks all stories**
3. Complete Phase 3: User Story 1 (T019-T026)
4. Complete Phase 4: User Story 2 (T027-T037)
5. Complete Phase 5: User Story 4 (T038-T043)
6. Complete Phase 8: MCP Integration (T056-T062)
7. **STOP and VALIDATE**: Test full workflow (session → annotate → export)
8. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Demo (session creation works!)
3. Add User Story 2 → Test independently → Demo (annotation works!)
4. Add User Story 4 → Test independently → Demo (export works - **MVP complete!**)
5. Add User Story 3 → Test independently → Deploy/Demo (relations work)
6. Add User Story 5 → Test independently → Deploy/Demo (progress tracking works)
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (session management)
   - Wait for US1 completion (blocks US2)
   - Developer A: User Story 2 (annotation)
   - Developer B: User Story 3 (relations) - can start in parallel with US2
3. Once US1+US2 done:
   - Developer A: User Story 4 (export)
   - Developer B: User Story 5 (progress)
4. Team integrates in Phase 8 together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Tests are NOT included as they were not explicitly requested in spec
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All Zod schemas use `.safeParse()` for validation (not `.parse()` which throws)
- All errors returned as Result types, never thrown (except exhaustiveness checks)
