# MCP Tool Schemas

Complete schema definitions for all 6 MCP tools. These will be generated from Zod schemas using `zod-to-json-schema`.

---

## 1. start_session

**Description**: Initialize a new annotation session with a config file

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "config": {
      "type": "object",
      "properties": {
        "chunks": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "chunk_id": { "type": "string", "minLength": 1 },
              "position": { "type": "integer", "minimum": 0 },
              "text": { "type": "string" }
            },
            "required": ["chunk_id", "position", "text"]
          },
          "minItems": 1
        }
      },
      "required": ["chunks"]
    }
  },
  "required": ["config"]
}
```

**Success Response**:
```json
{
  "content": [{
    "type": "text",
    "text": "{\"sessionId\":\"uuid\",\"chunkCount\":60,\"message\":\"Session created successfully\"}"
  }]
}
```

**Error Response** (isError: true):
```json
{
  "content": [{
    "type": "text",
    "text": "{\"type\":\"InvalidConfig\",\"message\":\"Config validation failed\",\"issues\":[...]}"
  }],
  "isError": true
}
```

---

## 2. annotate_chunk

**Description**: Annotate a single chunk with categories, subtypes, and metadata

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "sessionId": { "type": "string", "format": "uuid" },
    "chunkId": { "type": "string" },
    "categories": {
      "type": "array",
      "items": { "enum": ["fee_schedule", "footnotes"] }
    },
    "labels": {
      "type": "array",
      "items": { "enum": ["Fee Schedule", "Footnotes"] }
    },
    "subtypes": {
      "type": "object",
      "additionalProperties": {
        "enum": ["participant_fee", "legal_regulatory_fee", "port_fees_and_other_services", "market_data_fees", "fees_and_rebates", "reference"]
      }
    },
    "keywords": { "type": "array", "items": { "type": "string" } },
    "tags": { "type": "array", "items": { "type": "string" } },
    "notes": { "type": "string" },
    "summary": { "type": "string" }
  },
  "required": ["sessionId", "chunkId"]
}
```

**Success Response**:
```json
{
  "content": [{
    "type": "text",
    "text": "{\"chunk_id\":\"6_fee_schedule_Fee Schedule\",\"position\":6,\"categories\":[\"fee_schedule\"],...}"
  }]
}
```

---

## 3. annotate_chunks

**Description**: Annotate multiple chunks in a single call (partial success semantics)

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "sessionId": { "type": "string", "format": "uuid" },
    "annotations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "chunkId": { "type": "string" },
          "categories": { "type": "array", "items": { "enum": ["fee_schedule", "footnotes"] } },
          "labels": { "type": "array", "items": { "enum": ["Fee Schedule", "Footnotes"] } },
          "subtypes": { "type": "object" },
          "keywords": { "type": "array", "items": { "type": "string" } },
          "tags": { "type": "array", "items": { "type": "string" } },
          "notes": { "type": "string" },
          "summary": { "type": "string" }
        },
        "required": ["chunkId"]
      }
    }
  },
  "required": ["sessionId", "annotations"]
}
```

**Success Response** (partial success):
```json
{
  "content": [{
    "type": "text",
    "text": "{\"results\":[{\"chunkId\":\"1\",\"success\":true,\"data\":{...}},{\"chunkId\":\"2\",\"success\":false,\"error\":{...}}],\"successCount\":1,\"errorCount\":1}"
  }]
}
```

---

## 4. add_relation

**Description**: Define a directed relation between two chunks

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "sessionId": { "type": "string", "format": "uuid" },
    "sourceChunkId": { "type": "string" },
    "targetChunkId": { "type": "string" },
    "relationType": { "enum": ["dependencies", "footnotes", "references"] }
  },
  "required": ["sessionId", "sourceChunkId", "targetChunkId", "relationType"]
}
```

**Success Response**:
```json
{
  "content": [{
    "type": "text",
    "text": "{\"message\":\"Relation added\",\"sourceChunkId\":\"1\",\"targetChunkId\":\"2\",\"relationType\":\"dependencies\"}"
  }]
}
```

---

## 5. get_progress

**Description**: Query annotation progress for a session

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "sessionId": { "type": "string", "format": "uuid" }
  },
  "required": ["sessionId"]
}
```

**Success Response**:
```json
{
  "content": [{
    "type": "text",
    "text": "{\"totalChunks\":60,\"annotatedChunks\":58,\"pendingChunks\":2,\"completionPercentage\":96.67,\"pendingChunkIds\":[\"59\",\"60\"]}"
  }]
}
```

---

## 6. export_annotations

**Description**: Export complete annotation JSON for the session

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "sessionId": { "type": "string", "format": "uuid" }
  },
  "required": ["sessionId"]
}
```

**Success Response**:
```json
{
  "content": [{
    "type": "text",
    "text": "{\"chunks\":[{\"chunk_id\":\"0_fee_schedule_Fee Schedule\",\"position\":0,\"categories\":[\"fee_schedule\"],\"labels\":[\"Fee Schedule\"],\"subtypes\":{\"fee_schedule\":\"participant_fee\"},\"keywords\":[],\"tags\":[],\"relations\":{},\"notes\":\"\",\"summary\":\"\"}]}"
  }]
}
```

---

## Implementation Notes

1. **Zod → JSON Schema**: Use `zod-to-json-schema` to generate these schemas from Zod definitions
2. **Validation Order**: MCP input validation → Zod schema validation → Business logic validation
3. **Error Format**: Always return error objects with `type` discriminator for pattern matching
4. **Partial Success**: Only `annotate_chunks` uses partial success; others are atomic
5. **Response Format**: All responses wrapped in `{ content: [{ type: "text", text: JSON.stringify(...) }] }`
