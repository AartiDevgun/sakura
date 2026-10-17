import 'server-only'

import type {
  FeedbackRequest,
  FeedbackResponse,
  InvestigationResponse,
  ResearchResponse,
} from './schema'

/**
 * Placeholder payloads used only while SIGNALFORGE_API_URL is unset.
 * Every string is prefixed "[MOCK]" and no claim is made about the real company,
 * so nothing here can be mistaken for research output.
 */

import type { MockScenario } from './schema'
export type { MockScenario }

const MOCK_LATENCY_MS = 2600

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}

export class MockScenarioError extends Error {}

export async function mockResearch(
  company: string,
  scenario: MockScenario,
  signal?: AbortSignal,
): Promise<ResearchResponse> {
  await wait(MOCK_LATENCY_MS, signal)
  if (scenario === 'error') throw new MockScenarioError('[MOCK] Simulated research backend failure.')

  const researchId = `mock-research-${crypto.randomUUID()}`
  if (scenario === 'empty') return { mode: 'mock', researchId, company, angles: [] }

  return {
    mode: 'mock',
    researchId,
    company,
    angles: [
      {
        id: 'mock-angle-unit-economics',
        label: '[MOCK] Unit economics',
        title: '[MOCK] Placeholder angle: unit economics',
        rationale: `[MOCK] Placeholder text. No research was performed on ${company}. Connect the backend to receive real angles.`,
        signalStrength: 'moderate',
      },
      {
        id: 'mock-angle-hiring',
        label: '[MOCK] Hiring signals',
        title: '[MOCK] Placeholder angle: hiring signals',
        rationale: `[MOCK] Placeholder text. No job-posting data about ${company} was collected.`,
        signalStrength: 'weak',
      },
      {
        id: 'mock-angle-supply-chain',
        label: '[MOCK] Supply chain',
        title: '[MOCK] Placeholder angle: supply chain exposure',
        rationale: `[MOCK] Placeholder text. No supplier filings for ${company} were reviewed.`,
        signalStrength: 'strong',
      },
    ],
  }
}

export async function mockInvestigation(
  company: string,
  angleId: string,
  scenario: MockScenario,
  signal?: AbortSignal,
): Promise<InvestigationResponse> {
  await wait(MOCK_LATENCY_MS, signal)
  if (scenario === 'error') throw new MockScenarioError('[MOCK] Simulated investigation failure.')

  return {
    mode: 'mock',
    investigationId: `mock-investigation-${crypto.randomUUID()}`,
    angleId,
    discovery: {
      headline: '[MOCK] Placeholder discovery',
      summary: `[MOCK] This card shows where the backend's main discovery about ${company} will appear. It is not a finding.`,
      confidence: 'low',
      whyItMatters: [
        '[MOCK] Demonstrates the significance bullet layout only; no company-specific implication is established.',
        '[MOCK] This placeholder contains no verified financial evidence and must not be treated as a finding.',
        '[MOCK] A real report would reassess the conclusion when new comparable disclosures become available.',
      ],
    },
    report: {
      thesis: '[MOCK] Placeholder thesis. The real backend will state the claim being tested here.',
      calculations: [
        {
          label: '[MOCK] Example ratio',
          formula: 'metric_a / metric_b',
          inputs: [
            { name: '[MOCK] metric_a', value: '100 (placeholder)', sourceId: 'mock-src-1' },
            { name: '[MOCK] metric_b', value: '400 (placeholder)', sourceId: 'mock-src-1' },
          ],
          result: '0.25 (placeholder)',
          interpretation: '[MOCK] Demonstrates how calculations, inputs and source links are displayed.',
        },
      ],
      timeline: [
        { date: '2000-01-01', event: '[MOCK] Placeholder dated event', sourceId: 'mock-src-1' },
        { date: '2000-06-30', event: '[MOCK] Second placeholder event', sourceId: 'mock-src-2' },
      ],
      counterarguments: [
        {
          argument: '[MOCK] Placeholder counterargument.',
          assessment: '[MOCK] The real backend will explain how strongly this weakens the thesis.',
        },
      ],
      falsification: {
        condition: '[MOCK] Placeholder: the condition that would prove the thesis wrong.',
        metric: '[MOCK] metric_a / metric_b',
        checkBy: '2000-12-31',
      },
      sources: [
        { id: 'mock-src-1', title: '[MOCK] Placeholder source', url: 'https://example.com/', publisher: 'example.com' },
        { id: 'mock-src-2', title: '[MOCK] Second placeholder source', url: 'https://example.org/', publisher: 'example.org' },
      ],
    },
  }
}

export async function mockFeedback(payload: FeedbackRequest): Promise<FeedbackResponse> {
  return { mode: 'mock', investigationId: payload.investigationId, persisted: false }
}
