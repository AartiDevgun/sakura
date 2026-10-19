import type { InvestigationResponse, Source } from './schema'

export type DiscoveryAssessment = {
  verified: boolean
  reason: string
  publisherCount: number
  primaryCitedCount: number
  claimCount: number
  attentionScore: number
  evidenceScore: number
}

function sourceHost(url: string, fallback: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return fallback.toLowerCase()
  }
}

export function assessDiscovery(item: InvestigationResponse): DiscoveryAssessment {
  const sourcesById = new Map(item.report.sources.map(source => [source.id, source]))
  const claims = (item.report.evidence ?? []).filter(claim => {
    const source = sourcesById.get(claim.sourceId)
    return Boolean(source && claim.quote.trim().length >= 15)
  })
  const citedSources = claims
    .map(claim => sourcesById.get(claim.sourceId))
    .filter((source): source is Source => Boolean(source))
  const distinctDocuments = new Set(claims.map(claim => claim.sourceId)).size
  const publishers = new Set(citedSources.map(source => sourceHost(source.url, source.publisher || source.id)))
  const primaryCited = new Set(
    citedSources.filter(source => source.sourceTier === 'primary').map(source => source.id),
  )
  const findingText = [
    item.discovery.headline,
    item.discovery.summary,
    item.report.thesis,
    ...claims.map(claim => claim.claim),
  ].join(' ')
  const explicitlyInsufficient =
    /insufficient evidence|evidence is insufficient|not enough evidence|unable to assess|cannot establish|could not establish|no sufficiently supported discovery|no clear conclusion|data gap prevents|not possible to determine/i.test(findingText)

  const verified =
    !explicitlyInsufficient &&
    distinctDocuments >= 2 &&
    claims.length >= 2 &&
    publishers.size >= 2 &&
    primaryCited.size >= 1

  const reason = verified
    ? 'Passed quote, source-diversity and primary-disclosure checks.'
    : explicitlyInsufficient
      ? 'The report itself says the available evidence is insufficient.'
      : claims.length < 2 || distinctDocuments < 2
        ? 'Fewer than two independently traceable quoted claims support this finding.'
        : publishers.size < 2
          ? 'The supporting claims do not span at least two distinct publishers.'
          : 'No primary disclosure is linked directly to a verified claim.'

  // Rank actionable adverse signals ahead of routine/positive observations, while
  // using source breadth, confidence and checked calculations to break close ties.
  const attentionText = [
    item.discovery.headline,
    item.discovery.summary,
    ...claims.map(claim => claim.claim),
  ].join(' ')
  const attentionPatterns: Array<[RegExp, number]> = [
    [/\b(fraud|misstatement|restatement|regulatory action|licen[cs]e revoked|payment default|forensic audit|serious breach)\b/i, 5],
    [/\b(liquidity stress|capital shortfall|deposit outflow|sharp deterioration|rapid deterioration|material weakness|surge in (?:gross |net )?npa|spike in (?:gross |net )?npa)\b/i, 4],
    [/\b(margin compression|declining nim|nim fell|nim declined|rising (?:gross )?npa|rising credit cost|slippage spike|funding gap|deposit growth lag|one[- ]off income dependence|borrower concentration|customer concentration)\b/i, 3],
    [/\b(dependence|concentration|underperformance|widening|slowdown|regulatory|higher cost of funds|higher cost of deposits|provisioning pressure|asset quality concern|earnings quality concern)\b/i, 2],
    [/\b(fall|fell|decline|declined|deteriorat|weaken|pressure|risk|exposure|dependency|provision|slippage|liquidity|capital)\b/i, 1],
  ]
  let attentionScore = 0
  for (const [pattern, weight] of attentionPatterns) {
    if (pattern.test(attentionText)) {
      attentionScore = weight
      break
    }
  }

  const confidence = item.discovery.confidence === 'high' ? 3 : item.discovery.confidence === 'medium' ? 2 : 1
  const primarySourceBreadth = primaryCited.size
  const evidenceScore =
    confidence * 2 +
    Math.min(claims.length, 5) * 2 +
    Math.min(publishers.size, 4) * 2 +
    Math.min(primarySourceBreadth, 3) * 2 +
    item.report.calculations.length * 2 +
    Math.min(item.report.timeline.length, 3) * 0.5 +
    item.report.counterarguments.filter(counterargument => Boolean(counterargument.sourceId)).length * 0.5

  return {
    verified,
    reason,
    publisherCount: publishers.size,
    primaryCitedCount: primaryCited.size,
    claimCount: claims.length,
    attentionScore,
    evidenceScore,
  }
}

export function isVerifiedDiscovery(item: InvestigationResponse): boolean {
  return assessDiscovery(item).verified
}

export function rankDiscoveries(items: InvestigationResponse[]): InvestigationResponse[] {
  return [...items].sort((a, b) => {
    const aa = assessDiscovery(a)
    const bb = assessDiscovery(b)
    if (aa.verified !== bb.verified) return aa.verified ? -1 : 1
    if (aa.attentionScore !== bb.attentionScore) return bb.attentionScore - aa.attentionScore
    if (aa.evidenceScore !== bb.evidenceScore) return bb.evidenceScore - aa.evidenceScore
    return a.discovery.headline.localeCompare(b.discovery.headline)
  })
}
