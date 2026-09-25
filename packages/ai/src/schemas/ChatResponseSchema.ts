import { z } from "zod"

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system", "tool"]),
  content: z.string(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const ToolCallSchema = z.object({
  id: z.string(),
  type: z.enum(["searchProviders", "getServiceDetails", "getBookingSlots"]),
  arguments: z.record(z.string(), z.unknown()),
})

export const ToolResultSchema = z.object({
  toolCallId: z.string(),
  result: z.unknown(),
})

export const ChatResponseSchema = z.object({
  message: ChatMessageSchema,
  toolCalls: z.array(ToolCallSchema).optional(),
  suggestions: z.array(z.string()).max(3).optional(),
  requiresHandoff: z.boolean().default(false),
  handoffReason: z.string().optional(),
})

export const CompletionResponseSchema = z.object({
  text: z.string(),
  finishReason: z.enum(["stop", "length", "content_filter", "tool_calls"]),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }).optional(),
})

export type ChatMessage = z.infer<typeof ChatMessageSchema>
export type ChatResponse = z.infer<typeof ChatResponseSchema>
export type CompletionResponse = z.infer<typeof CompletionResponseSchema>
export type ToolCall = z.infer<typeof ToolCallSchema>
