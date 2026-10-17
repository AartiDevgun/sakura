type TextBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'heading'; text: string }

function splitLongLine(value: string): string[] {
  const line = value.trim()
  if (!line) return []

  // Sentence boundaries are split only when punctuation is followed by whitespace,
  // which avoids breaking decimals such as 3.8 or figures such as 12.5%.
  const sentences = line
    .split(/(?<=[.!?])\s+(?=[A-Z0-9•#])/)
    .map(part => part.trim())
    .filter(Boolean)
  if (sentences.length < 2) return [line]
  if (sentences.length === 2 && line.length < 180) return [line]

  // Keep paragraphs brief even if the model omitted its blank-line separators.
  const groupSize = sentences.length === 2 ? 1 : 2
  const paragraphs: string[] = []
  for (let index = 0; index < sentences.length; index += groupSize) {
    paragraphs.push(sentences.slice(index, index + groupSize).join(' '))
  }
  return paragraphs
}

function parseBlocks(value: string): TextBlock[] {
  const normalized = value.replace(/\r\n?/g, '\n').trim()
  if (!normalized) return []

  const rawBlocks = normalized.split(/\n\s*\n/).map(block => block.trim()).filter(Boolean)
  const blocks: TextBlock[] = []
  for (const block of rawBlocks) {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean)
    if (!lines.length) continue

    const bulletMatch = lines.every(line => /^[-*•]\s+/.test(line))
    const orderedMatch = lines.every(line => /^\d+[.)]\s+/.test(line))
    if (bulletMatch || orderedMatch) {
      blocks.push({
        type: 'list',
        ordered: orderedMatch,
        items: lines.map(line => line.replace(bulletMatch ? /^[-*•]\s+/ : /^\d+[.)]\s+/, '')),
      })
      continue
    }

    if (lines.length === 1 && /^#{1,3}\s+/.test(lines[0])) {
      blocks.push({ type: 'heading', text: lines[0].replace(/^#{1,3}\s+/, '') })
      continue
    }

    if (lines.length > 1) {
      // Preserve intentional single-line breaks from the model as separate paragraphs.
      for (const line of lines) {
        for (const paragraph of splitLongLine(line)) blocks.push({ type: 'paragraph', text: paragraph })
      }
    } else {
      for (const paragraph of splitLongLine(lines[0])) blocks.push({ type: 'paragraph', text: paragraph })
    }
  }
  return blocks
}

export function ParagraphText({
  text,
  className = 'space-y-3',
  paragraphClassName = '',
}: {
  text: string
  className?: string
  paragraphClassName?: string
}) {
  const blocks: TextBlock[] = parseBlocks(text)

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return <h4 key={index} className={'font-semibold text-rose-50 ' + paragraphClassName}>{block.text}</h4>
        }
        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul'
          return (
            <ListTag key={index} className={'space-y-1.5 pl-5 text-rose-100/75 ' + (block.ordered ? 'list-decimal' : 'list-disc') + ' ' + paragraphClassName}>
              {block.items.map((item, itemIndex) => <li key={itemIndex} className="leading-6">{item}</li>)}
            </ListTag>
          )
        }
        return <p key={index} className={'whitespace-pre-wrap break-words ' + paragraphClassName}>{block.text}</p>
      })}
    </div>
  )
}
