# Data Model: Annotation MCP Server

**Date**: 2025-12-16
**Purpose**: Define TypeScript types and Zod schemas for all entities

## Overview

The data model uses Zod schemas as the source of truth, with TypeScript types inferred. All Literal values are defined as Zod enums to enable runtime validation.

---

## Literal Types

### Category

**Values**: `fee_schedule`, `footnotes`

```typescript
import { z } from "zod";

export const CategorySchema = z.enum(["fee_schedule", "footnotes"]);
export type Category = z.infer<typeof CategorySchema>;
```

### Label

**Values**: `Fee Schedule`, `Footnotes`

```typescript
export const LabelSchema = z.enum(["Fee Schedule", "Footnotes"]);
export type Label = z.infer<typeof LabelSchema>;
```

### Subtype

**Fee Schedule Subtypes**: `participant_fee`, `legal_regulatory_fee`, `port_fees_and_other_services`, `market_data_fees`, `fees_and_rebates`

**Footnotes Subtypes**: `reference`

```typescript
export const FeeScheduleSubtypeSchema = z.enum([
  "participant_fee",
  "legal_regulatory_fee",
  "port_fees_and_other_services",
  "market_data_fees",
  "fees_and_rebates"
]);

export const FootnotesSubtypeSchema = z.enum(["reference"]);

export const SubtypeSchema = z.union([
  FeeScheduleSubtypeSchema,
  FootnotesSubtypeSchema
]);

export type FeeScheduleSubtype = z.infer<typeof FeeScheduleSubtypeSchema>;
export type FootnotesSubtype = z.infer<typeof FootnotesSubtypeSchema>;
export type Subtype = z.infer<typeof SubtypeSchema>;
```

### Relation Type

**Values**: `dependencies`, `footnotes`, `references`

```typescript
export const RelationTypeSchema = z.enum(["dependencies", "footnotes", "references"]);
export type RelationType = z.infer<typeof RelationTypeSchema>;
```

---

## Core Entities

### Config File

**Purpose**: Input structure containing document chunks to be annotated

```typescript
export const ConfigChunkSchema = z.object({
  chunk_id: z.string().min(1),
  position: z.number().int().nonnegative(),
  text: z.string()
});

export const ConfigFileSchema = z.object({
  chunks: z.array(ConfigChunkSchema).min(1, "Config must contain at least one chunk")
});

export type ConfigChunk = z.infer<typeof ConfigChunkSchema>;
export type ConfigFile = z.infer<typeof ConfigFileSchema>;
```

**Validation Rules**:
- At least 1 chunk required
- chunk_id must be unique within config (enforced in session creation)
- position must be non-negative integer

---

### Chunk Annotation

**Purpose**: Annotation metadata for a single chunk

```typescript
export const ChunkAnnotationSchema = z.object({
  chunk_id: z.string().describe("Format: {position}_{category}_{label}"),
  position: z.number().int().nonnegative(),
  categories: z.array(CategorySchema).default([]),
  labels: z.array(LabelSchema).default([]),
  subtypes: z.record(CategorySchema, SubtypeSchema).default({}),
  keywords: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  relations: z.record(RelationTypeSchema, z.array(z.string())).default({}),
  notes: z.string().default(""),
  summary: z.string().default("")
});

export type ChunkAnnotation = z.infer<typeof ChunkAnnotationSchema>;
```

**Field Descriptions**:
- `chunk_id`: Generated in format `{position}_{category}_{label}` (e.g., "6_fee_schedule_Fee Schedule")
- `position`: Zero-based index from config file
- `categories`: List of category IDs (validated against CategorySchema)
- `labels`: Human-readable category names (validated against LabelSchema)
- `subtypes`: Dictionary mapping category to its subtype (validated: subtype must belong to category)
- `keywords`: Free-form extracted keywords
- `tags`: Free-form user-defined tags
- `relations`: Dictionary of relation type → list of target chunk_ids
- `notes`: Annotator notes (free-form)
- `summary`: Content summary (free-form)

**Validation Rules**:
- If `subtypes` contains a key, the key must be in `categories`
- Subtype value must match the category's allowed subtypes
- Relation targets in `relations` must reference existing chunk_ids (validated at runtime)

---

### Annotation Export

**Purpose**: Complete export format matching output schema

```typescript
export const AnnotationExportSchema = z.object({
  chunks: z.array(ChunkAnnotationSchema)
});

export type AnnotationExport = z.infer<typeof AnnotationExportSchema>;
```

---

### Session

**Purpose**: In-memory session state tracking annotation work

```typescript
export const SessionStateSchema = z.enum(["active", "expired"]);
export type SessionState = z.infer<typeof SessionStateSchema>;

export const SessionSchema = z.object({
  id: z.string().uuid(),
  config: ConfigFileSchema,
  annotations: z.map(z.string(), ChunkAnnotationSchema),
  state: SessionStateSchema.default("active"),
  createdAt: z.date(),
  lastAccessedAt: z.date()
});

export type Session = z.infer<typeof SessionSchema>;
```

**Notes**:
- `id`: UUID v4 generated with crypto.randomUUID()
- `annotations`: Map of chunk_id → ChunkAnnotation (in-memory only, not persisted)
- `state`: Currently always "active" (future: support expiry)
- Sessions lost on server restart (in-memory only per clarifications)

---

## Error Types

### Discriminated Error Union

```typescript
export const SessionErrorSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("SessionNotFound"),
    sessionId: z.string(),
    message: z.string().default("Session not found")
  }),
  z.object({
    type: z.literal("InvalidConfig"),
    issues: z.array(z.any()), // ZodIssue[]
    message: z.string()
  }),
  z.object({
    type: z.literal("DuplicateChunkId"),
    chunkId: z.string(),
    message: z.string()
  })
]);

export const AnnotationErrorSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("InvalidCategory"),
    category: z.string(),
    validOptions: z.array(z.string()),
    message: z.string()
  }),
  z.object({
    type: z.literal("InvalidSubtype"),
    subtype: z.string(),
    category: z.string(),
    validOptions: z.array(z.string()),
    message: z.string()
  }),
  z.object({
    type: z.literal("ChunkNotFound"),
    chunkId: z.string(),
    message: z.string()
  }),
  z.object({
    type: z.literal("SubtypeCategoryMismatch"),
    subtype: z.string(),
    category: z.string(),
    message: z.string()
  })
]);

export const RelationErrorSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("InvalidRelationType"),
    relationType: z.string(),
    validOptions: z.array(z.string()),
    message: z.string()
  }),
  z.object({
    type: z.literal("TargetNotFound"),
    targetChunkId: z.string(),
    message: z.string()
  })
]);

export type SessionError = z.infer<typeof SessionErrorSchema>;
export type AnnotationError = z.infer<typeof AnnotationErrorSchema>;
export type RelationError = z.infer<typeof RelationErrorSchema>;
```

---

## Result Types

```typescript
export type Success<T> = { success: true; data: T };
export type Failure<E> = { success: false; error: E };
export type Result<T, E> = Success<T> | Failure<E>;

// Common result types
export type SessionResult<T> = Result<T, SessionError>;
export type AnnotationResult<T> = Result<T, AnnotationError>;
export type RelationResult<T> = Result<T, RelationError>;
```

---

## Validation Functions

### Category-Subtype Validation

```typescript
export function validateSubtypeForCategory(
  category: Category,
  subtype: string
): Result<Subtype, AnnotationError> {
  if (category === "fee_schedule") {
    const result = FeeScheduleSubtypeSchema.safeParse(subtype);
    if (!result.success) {
      return {
        success: false,
        error: {
          type: "InvalidSubtype",
          subtype,
          category,
          validOptions: FeeScheduleSubtypeSchema.options,
          message: `Invalid subtype for fee_schedule. Valid options: ${FeeScheduleSubtypeSchema.options.join(", ")}`
        }
      };
    }
    return { success: true, data: result.data };
  }

  if (category === "footnotes") {
    const result = FootnotesSubtypeSchema.safeParse(subtype);
    if (!result.success) {
      return {
        success: false,
        error: {
          type: "InvalidSubtype",
          subtype,
          category,
          validOptions: FootnotesSubtypeSchema.options,
          message: `Invalid subtype for footnotes. Valid options: ${FootnotesSubtypeSchema.options.join(", ")}`
        }
      };
    }
    return { success: true, data: result.data };
  }

  // TypeScript exhaustiveness check ensures all categories handled
  const _exhaustive: never = category;
  throw new Error(`Unhandled category: ${_exhaustive}`);
}
```

---

## Batch Operation Types

### Batch Annotation Result

```typescript
export const AnnotationItemResultSchema = z.object({
  chunkId: z.string(),
  success: z.boolean(),
  data: ChunkAnnotationSchema.optional(),
  error: AnnotationErrorSchema.optional()
});

export const BatchAnnotationResultSchema = z.object({
  results: z.array(AnnotationItemResultSchema),
  successCount: z.number().int().nonnegative(),
  errorCount: z.number().int().nonnegative()
});

export type AnnotationItemResult = z.infer<typeof AnnotationItemResultSchema>;
export type BatchAnnotationResult = z.infer<typeof BatchAnnotationResultSchema>;
```

---

## Summary

**Total Entities**: 10
- 5 Literal types (Category, Label, Subtype variants, RelationType)
- 5 Core entities (ConfigFile, ChunkAnnotation, AnnotationExport, Session, Batch Result)
- 3 Error unions (SessionError, AnnotationError, RelationError)

**Type Safety Guarantees**:
- All Literal values validated at runtime via Zod
- Discriminated unions ensure exhaustive error handling
- Dependent validation (category → subtype) enforced
- Result types force error consideration at call sites

**Next Steps**: Generate MCP tool contracts using these schemas
