import { z } from 'zod';

// Config Chunk Schema

export const ConfigChunkSchema = z.object({
  chunk_id: z.string().min(1),
  position: z.number().int().nonnegative(),
  text: z.string(),
});
export type ConfigChunk = z.infer<typeof ConfigChunkSchema>;

// Config File Schema

export const ConfigFileSchema = z.object({
  chunks: z.array(ConfigChunkSchema).min(1, 'Config must contain at least one chunk'),
});
export type ConfigFile = z.infer<typeof ConfigFileSchema>;
