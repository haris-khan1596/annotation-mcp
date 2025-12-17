# Feature Specification: Annotation MCP Server

**Feature Branch**: `001-annotation-mcp`
**Created**: 2025-12-16
**Status**: Draft
**Input**: User description: "MCP server for generating annotation JSON from config files with relations, categories, sub-categories, and positions"

## Clarifications

### Session 2025-12-16

- Q: Should categories/subtypes use fixed Literals or open strings? → A: Fixed Literals - Server validates against predefined categories/subtypes; rejects unknown values.
- Q: Should sessions be persisted to disk or in-memory only? → A: In-memory only for simplicity; architecture should allow future persistence extensibility.
- Q: Should annotation support batch or single-chunk operations? → A: Both - Provide separate tools for single (`annotate_chunk`) and batch (`annotate_chunks`) operations.
- Q: Should batch operations use atomic or partial success semantics? → A: Partial - Apply valid annotations, skip invalid ones, return detailed per-chunk success/error results.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Initialize Annotation Session (Priority: P1)

An LLM receives a config file containing document chunks that need to be annotated. The LLM uses the MCP server to start an annotation session, which validates the config structure and prepares the server to track annotations for that document.

**Why this priority**: This is the foundation - without session initialization, no annotation work can begin. It establishes the context for all subsequent operations.

**Independent Test**: Can be fully tested by providing a valid config file and verifying the session is created with proper state tracking.

**Acceptance Scenarios**:

1. **Given** a valid config file with document chunks, **When** the LLM calls the start-session tool with the config, **Then** the server returns a session ID and acknowledges the document structure (chunk count, detected categories).
2. **Given** an invalid or malformed config file, **When** the LLM calls the start-session tool, **Then** the server returns a clear error describing what is wrong with the config structure.
3. **Given** the server has no active session, **When** the LLM attempts any annotation operation, **Then** the server returns an error indicating a session must be started first.

---

### User Story 2 - Add Annotations to Chunks (Priority: P1)

An LLM needs to assign categories, sub-categories, and other metadata to specific chunks in the document. The MCP server provides both single-chunk (`annotate_chunk`) and batch (`annotate_chunks`) tools, validating inputs against predefined Literal types and tracking positions.

**Why this priority**: This is the core value - the actual annotation of content. Without this, the server provides no utility.

**Independent Test**: Can be tested by starting a session, adding annotations to chunks (single and batch), and verifying the annotations are recorded correctly.

**Acceptance Scenarios**:

1. **Given** an active session, **When** the LLM adds a category annotation to a single chunk using `annotate_chunk`, **Then** the server validates the category against allowed Literals and records it with confirmation.
2. **Given** an active session, **When** the LLM adds a sub-category to a chunk, **Then** the server validates the sub-category belongs to the parent category's allowed subtypes and records it.
3. **Given** an active session, **When** the LLM adds annotations with tags, labels, summary, or notes, **Then** the server records all provided metadata fields.
4. **Given** an invalid chunk ID or position, **When** the LLM attempts to annotate, **Then** the server returns an error identifying the invalid reference.
5. **Given** an invalid category or subtype value, **When** the LLM attempts to annotate, **Then** the server returns an error listing the valid options.
6. **Given** an active session, **When** the LLM uses `annotate_chunks` with multiple chunk annotations, **Then** the server applies valid annotations, skips invalid ones, and returns per-chunk success/error details.
7. **Given** a batch with mixed valid/invalid annotations, **When** the LLM submits via `annotate_chunks`, **Then** valid annotations are persisted and invalid ones are reported with specific errors (partial success).

---

### User Story 3 - Define Relations Between Chunks (Priority: P2)

An LLM needs to establish relationships between chunks (e.g., dependencies, footnote references, cross-references). The MCP server provides tools to define and validate these relations.

**Why this priority**: Relations add semantic structure to annotations, enabling downstream systems to understand document relationships. Critical for documents like fee schedules where sections reference each other.

**Independent Test**: Can be tested by creating a session, adding chunks, then defining relations between them and verifying the relation graph.

**Acceptance Scenarios**:

1. **Given** two annotated chunks, **When** the LLM defines a "dependencies" relation from chunk A to chunk B, **Then** the server records the directed relation and returns confirmation.
2. **Given** annotated chunks, **When** the LLM defines a "footnotes" relation linking content to its footnote, **Then** the server records the relation with the appropriate type.
3. **Given** a reference to a non-existent chunk, **When** the LLM attempts to create a relation, **Then** the server returns an error identifying the invalid chunk reference.

---

### User Story 4 - Export Annotation JSON (Priority: P1)

After completing annotations, the LLM needs to export the final annotation JSON file with all recorded categories, sub-categories, relations, and positions in a consistent format.

**Why this priority**: The entire purpose of the server is to produce consistent annotation output. Without export, all annotation work is lost.

**Independent Test**: Can be tested by completing a full annotation workflow and exporting, then validating the output JSON structure.

**Acceptance Scenarios**:

1. **Given** a session with annotations, **When** the LLM requests export, **Then** the server returns a complete JSON with all chunks, their annotations, and relations.
2. **Given** a session with incomplete annotations, **When** the LLM requests export, **Then** the server returns the JSON with annotated chunks included and un-annotated chunks marked as pending.
3. **Given** an exported annotation, **When** compared to the expected format, **Then** it contains: chunk_id, position, categories, labels, subtypes, keywords, tags, notes, summary, and relations fields.

---

### User Story 5 - Query Annotation Progress (Priority: P3)

An LLM may need to check which chunks have been annotated and which remain pending. The MCP server provides a progress query tool to support iterative annotation workflows.

**Why this priority**: Enables the LLM to manage long annotation sessions effectively, but not essential for basic functionality.

**Independent Test**: Can be tested by partially annotating a document and querying progress statistics.

**Acceptance Scenarios**:

1. **Given** a session with some annotated chunks, **When** the LLM queries progress, **Then** the server returns counts of annotated vs. pending chunks and lists pending chunk IDs.
2. **Given** a fully annotated session, **When** the LLM queries progress, **Then** the server returns 100% completion status.

---

### Edge Cases

- What happens when the config file has zero chunks? The server should return an error indicating no content to annotate.
- What happens when a chunk ID in the config is duplicated? The server should reject the config with a validation error.
- What happens when the LLM tries to add the same annotation twice? The server should update/replace the existing annotation rather than create duplicates.
- What happens when the session times out or connection is lost? Sessions are in-memory only; the LLM must re-initialize a new session. The server should return a clear error if an invalid/expired session ID is used.
- What happens when relation types are invalid? The server should validate against known relation types (dependencies, footnotes, references) and reject unknown types with a clear error listing valid options.
- What happens when an invalid category or subtype is provided? The server should reject with an error listing valid Literal values.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept a config file containing document chunks and initialize an annotation session.
- **FR-002**: System MUST validate config file structure before accepting it, rejecting malformed configs with specific error messages.
- **FR-003**: System MUST allow annotations to include: categories, sub-categories (subtypes), labels, tags, keywords, notes, and summary.
- **FR-003a**: System MUST provide single-chunk annotation tool (`annotate_chunk`) for annotating one chunk at a time.
- **FR-003b**: System MUST provide batch annotation tool (`annotate_chunks`) for annotating multiple chunks in one call, using partial success semantics (apply valid, skip invalid, return per-chunk results).
- **FR-004**: System MUST track the position of each chunk within the document.
- **FR-005**: System MUST support relation types: `dependencies`, `footnotes`, and `references` between chunks.
- **FR-006**: System MUST validate that relation targets exist before recording relations.
- **FR-007**: System MUST export annotations in a consistent JSON format matching the expected schema.
- **FR-008**: System MUST report annotation progress showing completed vs. pending chunks.
- **FR-009**: System MUST provide clear, actionable error messages for all failure scenarios.
- **FR-010**: System MUST prevent duplicate annotations on the same chunk field, updating instead of duplicating.
- **FR-011**: System MUST validate categories against predefined Literal values: `fee_schedule`, `footnotes`.
- **FR-012**: System MUST validate subtypes against their parent category's allowed values (fee_schedule: `participant_fee`, `legal_regulatory_fee`, `port_fees_and_other_services`, `market_data_fees`, `fees_and_rebates`; footnotes: `reference`).
- **FR-013**: System MUST validate labels against predefined values: `Fee Schedule`, `Footnotes`.

### Key Entities

- **Config File**: Input document containing chunks to be annotated. Key attributes: list of chunks, each with chunk_id, position, and text content.

- **Annotation Session**: A stateful context tracking annotation work for a single config file. Stored in-memory only (lost on server restart); architecture allows future persistence. Key attributes: session_id, config reference, annotation state, creation timestamp.

- **Chunk Annotation**: The annotation data for a single chunk. Key attributes:
  - `chunk_id`: Format `{position}_{category}_{label}` (e.g., "6_fee_schedule_Fee Schedule")
  - `position`: Zero-based integer index in document
  - `categories`: List of category IDs (Literal: `fee_schedule` | `footnotes`)
  - `labels`: List of human-readable names (Literal: `Fee Schedule` | `Footnotes`)
  - `subtypes`: Dictionary mapping category to subtype (e.g., `{"fee_schedule": "participant_fee"}`)
  - `keywords`: List of extracted keywords (free-form strings)
  - `tags`: List of user-defined tags (free-form strings)
  - `notes`: Annotator notes (free-form string)
  - `summary`: Content summary (free-form string)
  - `relations`: Dictionary of relation type to list of target chunk_ids

- **Relation**: A directional link between chunks. Relation types (Literal): `dependencies` | `footnotes` | `references`. Stored as dictionary in chunk annotation.

- **Annotation Output**: The final exported JSON containing a `chunks` array with all chunk annotations.

### Allowed Values (Literals)

| Field | Allowed Values |
|-------|----------------|
| Category | `fee_schedule`, `footnotes` |
| Label | `Fee Schedule`, `Footnotes` |
| Subtype (fee_schedule) | `participant_fee`, `legal_regulatory_fee`, `port_fees_and_other_services`, `market_data_fees`, `fees_and_rebates` |
| Subtype (footnotes) | `reference` |
| Relation Type | `dependencies`, `footnotes`, `references` |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: LLMs can complete a full annotation workflow (session start → annotations → export) in a single conversation session.
- **SC-002**: 100% of valid config files are accepted without error; 100% of invalid configs produce a specific validation error message.
- **SC-003**: Exported annotation JSON passes schema validation in 100% of cases.
- **SC-004**: All annotation operations return responses within 2 seconds for documents with up to 100 chunks.
- **SC-005**: Error messages are specific enough that an LLM can understand and correct the issue without human intervention in 90% of error cases.
- **SC-006**: Annotation output format consistency is 100% - all exports follow the identical schema structure.
- **SC-007**: 100% of invalid category/subtype/relation values are rejected with an error listing valid options.

## Assumptions

- The config file format follows the structure shown in the provided examples (fee schedule chunks with text, position, metadata).
- The LLM client will follow a sequential workflow: initialize session → annotate chunks → define relations → export.
- The server will be used by a single LLM at a time per session (no concurrent multi-user annotation of the same document).
- Relation types are predefined (`dependencies`, `footnotes`, `references`) - validated against Literal types.
- Categories and subtypes are predefined as Literal types - new values require server configuration updates.
- The LLM operates as a "junior annotator" following rulesets and SOPs provided in its system prompt.
