type TextBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'heading'; text: string }

function splitLongLine(value: string): string[] {
  const line = value.trim()
  if (!line) return []
  if (line.length < 320) return [line]

  // Model replies sometimes arrive as one long line. Group sentences into short
  // paragraphs so they stay scannable even when the model omits blank lines.
  const sentences = line.match(/[^.!?]+(?:[.!?]+|$)/g)?.map(part => part.trim()).filter(Boolean) ?? [line]
  if (sentences.length < 3) return [line]

  const paragraphs: string[] = []
  for (let index = 0; index < sentences.length; index += 2) {
    paragraphs.push(sentences.slice(index, index + 2).join(' '))
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
