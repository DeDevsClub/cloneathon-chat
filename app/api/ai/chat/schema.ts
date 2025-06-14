import { z } from 'zod';

const textPartSchema = z.object({
  text: z.string().min(1).max(10000),
  type: z.enum(['text']),
});

const messageSchema = z.object({
  id: z.string(),
  createdAt: z.string().or(z.date()).optional(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(10000),
  parts: z.array(textPartSchema).optional(),
  experimental_attachments: z
    .array(
      z.object({
        url: z.string().url(),
        name: z.string().min(1).max(2000),
        contentType: z.enum(['image/png', 'image/jpg', 'image/jpeg']),
      }),
    )
    .optional(),
});

// Schema for the structured request format
export const postRequestBodySchema = z.object({
  id: z.string(),
  projectId: z.string().optional(),
  messages: z.array(messageSchema),
  selectedChatModel: z.enum(['chat-model', 'chat-model-reasoning']).optional(),
  selectedVisibilityType: z.enum(['public', 'private']).optional(),
});

// Alternative schema for the simpler message format
export const simpleRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    }),
  ),
  model: z.string().optional(),
  temperature: z.number().optional(),
  stream: z.boolean().optional(),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
export type SimpleRequestBody = z.infer<typeof simpleRequestSchema>;
