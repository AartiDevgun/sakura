
Selected angle: ${angleTitle}
Original rationale: ${angleRationale || 'No original rationale is available.'}

Do not assume the hypothesis is true. Assess whether the evidence supports it, contradicts it, or is insufficient. Distinguish confirmed facts, plausible explanations, and unknowns. Explicitly mention if some searches may have failed or evidence is too thin.

Retrieved source excerpts:
${JSON.stringify(evidenceForPrompt(sources))}

Return JSON in this shape:
{
  "headline": "One specific discovery; state uncertainty if evidence is insufficient",
  "summary": "Concise evidence-based explanation",
  "confidence": "low | medium | high",
  "thesis": "What the evidence supports and what it does not establish",
  "calculationCandidates": [
    {
      "label": "Metric being compared",
      "kind": "percent_change | absolute_change | ratio | percentage_point_change",
      "priorValue": 100,
      "currentValue": 125,
      "unit": "INR crore",
      "priorPeriod": "FY2024",
      "currentPeriod": "FY2025",
      "priorSourceIndex": 0,
      "currentSourceIndex": 1,
      "priorQuote": "Exact quotation copied from the prior source excerpt",
      "currentQuote": "Exact quotation copied from the current source excerpt",
      "interpretation": "What the calculated change may indicate, without claiming causation"
    }
  ],
  "timeline": [
    { "date": "YYYY-MM-DD or disclosed period", "event": "Supported event", "sourceIndex": 0 }
  ],
  "counterarguments": [
    { "argument": "Strongest plausible alternative explanation", "assessment": "Evidence for or against it", "sourceIndex": 1 }
  ],
  "falsification": {
    "condition": "A concrete future observation that would weaken or overturn the conclusion",
    "metric": "Metric to monitor or empty string",
    "checkBy": "A reasonable future date or empty string"
  }
}

Rules:
- Use only the supplied sources and their sourceIndex values.
- Include calculations only when both figures and exact quotations are present in the excerpts; the application independently calculates the result.
- If values are missing or incomparable, return an empty calculationCandidates array.
- Include real counterarguments, not straw men.
- Never invent source links, financial values, dates or causal explanations.
- Source classifications are provenance hints, not proof of truth.
- If evidence is insufficient, explicitly say so rather than manufacturing a discovery.`,
    signal,
  )

  const calculations = verifiedCalculations(result.calculationCandidates, sources)
  const timeline: TimelineEvent[] = (Array.isArray(result.timeline) ? result.timeline : [])
    .slice(0, 8)
    .map(value => {
      const item = record(value)
      const sourceIndex = validIndex(item.sourceIndex, sources.length)
      return {
        date: text(item.date, 'Date not disclosed'),
        event: text(item.event, 'Event not verified'),
        sourceId: sourceIndex === undefined ? undefined : sources[sourceIndex].source.id,
      }
    })

  const counterarguments: Counterargument[] = (
    Array.isArray(result.counterarguments) ? result.counterarguments : []
  )
    .slice(0, 5)
    .map(value => {
      const item = record(value)
      const sourceIndex = validIndex(item.sourceIndex, sources.length)
      return {
        argument: text(item.argument, 'Alternative explanation not supplied.'),
        assessment: text(item.assessment, 'The available evidence is insufficient to assess this alternative.'),
        sourceId: sourceIndex === undefined ? undefined : sources[sourceIndex].source.id,
      }
    })

  const rawConfidence = result.confidence
  let confidence: 'low' | 'medium' | 'high' =
    rawConfidence === 'high' || rawConfidence === 'medium' || rawConfidence === 'low'
      ? rawConfidence
      : 'low'

  // High confidence requires broad evidence and at least one source-checked calculation.
  if (sources.length < 4 || calculations.length === 0) {
    if (confidence === 'high') confidence = 'medium'
  }
  if (sources.length < 2 && confidence === 'medium') confidence = 'low'

  const falsification = record(result.falsification)
  return {
    mode: 'live',
    investigationId: `investigation-${randomUUID()}`,
    angleId,
    discovery: {
      headline: text(result.headline, 'No sufficiently supported discovery'),
      summary: text(
        result.summary,
        'The retrieved evidence is insufficient to establish a reliable conclusion.',
      ),
      confidence,
    },
    report: {
      thesis: text(result.thesis, 'The available evidence does not yet support a firm conclusion.'),
      calculations,
      timeline,
      counterarguments,
      falsification: {
        condition: text(
          falsification.condition,
          'Reconsider the conclusion if future comparable disclosures contradict the observed pattern.',
        ),
        metric: text(falsification.metric) || undefined,
        checkBy: text(falsification.checkBy) || undefined,
      },
      sources: sources.map(item => item.source),
    },
  }
}
