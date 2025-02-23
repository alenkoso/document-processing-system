import { z } from 'zod';

const ConfigSchema = z.object({
  PORT: z.string().optional().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  OPENAI_API_KEY: z.string().min(1),
  DOCUMENTS_PATH: z.string().min(1)
});

export const config = ConfigSchema.parse(process.env); 