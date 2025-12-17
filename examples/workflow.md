# Sample Annotation Workflow

This document shows a complete annotation workflow using the MCP tools.

## 1. Start Session

```json
// Tool: start_session
{
  "config": {
    "chunks": [
      { "chunk_id": "chunk_0", "position": 0, "text": "Section I: Participant Fees..." },
      { "chunk_id": "chunk_1", "position": 1, "text": "Monthly Participant Fee..." },
      { "chunk_id": "chunk_2", "position": 2, "text": "Legal and Regulatory Fee..." },
      { "chunk_id": "chunk_footnote_1", "position": 3, "text": "Note 1: Fees subject to change..." }
    ]
  }
}

// Response:
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "chunkCount": 4,
  "message": "Session created successfully"
}
```

## 2. Annotate Chunks (Batch)

```json
// Tool: annotate_chunks
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "annotations": [
    {
      "chunkId": "chunk_0",
      "categories": ["fee_schedule"],
      "labels": ["Fee Schedule"],
      "subtypes": { "fee_schedule": "participant_fee" },
      "tags": ["initiation", "one-time"],
      "summary": "One-time initiation fee of $2,500"
    },
    {
      "chunkId": "chunk_1",
      "categories": ["fee_schedule"],
      "labels": ["Fee Schedule"],
      "subtypes": { "fee_schedule": "participant_fee" },
      "tags": ["monthly", "recurring"],
      "summary": "Monthly recurring fee of $1,500"
    },
    {
      "chunkId": "chunk_2",
      "categories": ["fee_schedule"],
      "labels": ["Fee Schedule"],
      "subtypes": { "fee_schedule": "legal_regulatory_fee" },
      "tags": ["quarterly"],
      "summary": "Quarterly legal and regulatory fee"
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

// Response:
{
  "results": [
    { "chunkId": "chunk_0", "success": true, "data": {...} },
    { "chunkId": "chunk_1", "success": true, "data": {...} },
    { "chunkId": "chunk_2", "success": true, "data": {...} },
    { "chunkId": "chunk_footnote_1", "success": true, "data": {...} }
  ],
  "successCount": 4,
  "errorCount": 0
}
```

## 3. Add Relations

```json
// Tool: add_relation
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "sourceChunkId": "chunk_0",
  "targetChunkId": "chunk_footnote_1",
  "relationType": "footnotes"
}

// Response:
{
  "message": "Relation added",
  "sourceChunkId": "chunk_0",
  "targetChunkId": "chunk_footnote_1",
  "relationType": "footnotes"
}
```

## 4. Check Progress

```json
// Tool: get_progress
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}

// Response:
{
  "totalChunks": 4,
  "annotatedChunks": 4,
  "pendingChunks": 0,
  "completionPercentage": 100,
  "pendingChunkIds": []
}
```

## 5. Export Annotations

```json
// Tool: export_annotations
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}

// Response:
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
