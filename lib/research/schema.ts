import { z } from 'zod'

export const backendModeSchema = z.enum(['live', 'mock'])
export type BackendMode = z.infer<typeof backendModeSchema>

/** Test-only scenarios the API routes honour while running on mock data. */
export type MockScenario = 'default' | 'empty' | 'error'

export const companyInputSchema = z
  .string()
  .trim()
  .min(2, 'Enter at least 2 characters.')
  .max(120, 'Company names are limited to 120 characters.')

export const researchRequestSchema = z.object({
  company: companyInputSchema,
})

export const researchAngleSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(48),
  title: z.string().min(1),
  rationale: z.string().min(1),
  signalStrength: z.enum(['weak', 'moderate', 'strong']).optional(),
})
export type ResearchAngle = z.infer<typeof researchAngleSchema>

export const researchResponseSchema = z.object({
  mode: backendModeSchema,
  researchId: z.string().min(1),
  company: z.string().min(1),
  angles: z.array(researchAngleSchema),
})
export type ResearchResponse = z.infer<typeof researchResponseSchema>

export const investigateRequestSchema = z.object({
  researchId: z.string().min(1).max(200),
  company: companyInputSchema,
  angleId: z.string().min(1).max(200),
})

const sourceRef = z.string().min(1).optional()

export const sourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.url(),
  publisher: z.string().optional(),
  publishedAt: z.string().optional(),
  accessedAt: z.string().optional(),
})
export type Source = z.infer<typeof sourceSchema>

export const calculationSchema = z.object({
  label: z.string().min(1),
  formula: z.string().min(1),
  inputs: z.array(
    z.object({
      name: z.string().min(1),
      value: z.string().min(1),
      sourceId: sourceRef,
    }),
  ),
  result: z.string().min(1),
  interpretation: z.string().min(1),
})
export type Calculation = z.infer<typeof calculationSchema>

export const timelineEventSchema = z.object({
  date: z.string().min(1),
  event: z.string().min(1),
  sourceId: sourceRef,
})
export type TimelineEvent = z.infer<typeof timelineEventSchema>

export const counterargumentSchema = z.object({
  argument: z.string().min(1),
  assessment: z.string().min(1),
  sourceId: sourceRef,
})
export type Counterargument = z.infer<typeof counterargumentSchema>

export const investigationResponseSchema = z.object({
  mode: backendModeSchema,
  investigationId: z.string().min(1),
  angleId: z.string().min(1),
  discovery: z.object({
    headline: z.string().min(1),
    summary: z.string().min(1),
    confidence: z.enum(['low', 'medium', 'high']),
  }),
  report: z.object({
    thesis: z.string().min(1),
    calculations: z.array(calculationSchema),
    timeline: z.array(timelineEventSchema),
    counterarguments: z.array(counterargumentSchema),
    falsification: z.object({
      condition: z.string().min(1),
      metric: z.string().optional(),
      checkBy: z.string().optional(),
    }),
    sources: z.array(sourceSchema),
  }),
})
export type InvestigationResponse = z.infer<typeof investigationResponseSchema>

export const feedbackRequestSchema = z.object({
  investigationId: z.string().min(1).max(200),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
})
export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>

export const feedbackResponseSchema = z.object({
  mode: backendModeSchema,
  investigationId: z.string().min(1),
  persisted: z.boolean(),
})
export type FeedbackResponse = z.infer<typeof feedbackResponseSchema>

export type ApiError = { error: string }
