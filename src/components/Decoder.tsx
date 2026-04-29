import { useMemo, useState } from 'react'
import { decodeShell, scanSpans } from '../encoding'
import { type ShellPayload, type Part } from '../types'
import { PartRenderer } from './renderers/PartRenderer'

type PlayMode = 'oneshot' | 'chapter'

interface DecodedShell {
  carrier: string
  payload: ShellPayload
  // parts expanded: inline shells within text spans are resolved
  allParts: Part[]
}

interface ShellTrailItem {
  carrier: string
  partCount: number
  depth: number
  path: string[]
}

function buildDecodedShell(carrier: string, payload: ShellPayload): DecodedShell {
  // Expand any text parts that contain embedded encoded shells into separate parts
  const allParts: Part[] = []
  for (const part of payload.parts) {
    if (part.t === 'text') {
      const spans = scanSpans(part.c)
      if (spans.length === 1 && spans[0].type === 'text') {
        allParts.push(part)
      } else {
        for (const span of spans) {
          if (span.type === 'text') allParts.push({ t: 'text', c: span.value })
          else allParts.push({ t: 'shell', c: span.value })
        }
      }
    } else {
      allParts.push(part)
    }
  }
  return { carrier, payload, allParts }
}

function orderParts(parts: Part[]): Part[] {
  return [
    ...parts.filter(part => part.t !== 'shell'),
    ...parts.filter(part => part.t === 'shell'),
  ]
}

function collectShellTrail(shell: DecodedShell, depth = 0, seen = new Set<string>(), path: string[] = []): ShellTrailItem[] {
  const trail: ShellTrailItem[] = [{ carrier: shell.carrier, partCount: shell.allParts.length, depth, path }]
  if (seen.has(shell.carrier + shell.allParts.map(part => part.c).join(''))) return trail

  const nextSeen = new Set(seen)
  nextSeen.add(shell.carrier + shell.allParts.map(part => part.c).join(''))

  for (const part of shell.allParts) {
    if (part.t !== 'shell') continue
    const decoded = decodeShell(part.c)
    if (!decoded) continue
    trail.push(...collectShellTrail(
      buildDecodedShell(decoded.carrier, decoded.payload),
      depth + 1,
      nextSeen,
      [...path, part.c],
    ))
  }
  return trail
}

export function Decoder() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<PlayMode>('chapter')
  const [nestedStack, setNestedStack] = useState<DecodedShell[]>([])
  const [chapter, setChapter] = useState(1)             // visible non-shell parts in chapter mode

  const decoded = useMemo(() => {
    const trimmed = input.trim()
    if (!trimmed) return { root: null, error: '' }

    const result = decodeShell(trimmed)
    if (!result) {
      return { root: null, error: 'No hidden shell found in this input.' }
    }
    return { root: buildDecodedShell(result.carrier, result.payload), error: '' }
  }, [input])

  const stack = decoded.root ? [decoded.root, ...nestedStack] : []
  const current = stack[stack.length - 1]
  const shellTrail = useMemo(() => decoded.root ? collectShellTrail(decoded.root) : [], [decoded.root])
  const orderedParts = current ? orderParts(current.allParts) : []
  const contentParts = orderedParts.filter(part => part.t !== 'shell')
  const shellParts = orderedParts.filter(part => part.t === 'shell')

  const handleInputChange = (value: string) => {
    setInput(value)
    setNestedStack([])
    setChapter(1)
  }

  const openShell = (encoded: string) => {
    const result = decodeShell(encoded)
    if (!result) return
    setNestedStack(prev => [...prev, buildDecodedShell(result.carrier, result.payload)])
    setChapter(1)
  }

  const goBack = () => {
    setNestedStack(prev => prev.slice(0, -1))
    setChapter(1)
  }

  const jumpToTrailItem = (item: ShellTrailItem) => {
    const nextStack: DecodedShell[] = []
    for (const encoded of item.path) {
      const decoded = decodeShell(encoded)
      if (!decoded) break
      nextStack.push(buildDecodedShell(decoded.carrier, decoded.payload))
    }
    setNestedStack(nextStack)
    setChapter(1)
  }

  const visibleParts = current
    ? mode === 'oneshot'
      ? orderedParts
      : [...contentParts.slice(0, chapter), ...shellParts]
    : []

  const hasMore = current && mode === 'chapter' && chapter < contentParts.length
  const isDone = current && !hasMore

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="bg-[#1c1b24] rounded-2xl p-5">
        <div className="text-xs font-semibold uppercase tracking-widest text-[#6b6479] mb-3">
          Paste encoded emoji
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => handleInputChange(e.target.value)}
            placeholder="Drop your 🪆 here…"
            className="flex-1 bg-[#13121a] rounded-xl px-4 py-3 text-2xl outline-none border border-[#2a2836] focus:border-[#7c3aed] transition-colors placeholder:text-[#4b4859] placeholder:text-base"
          />
          {input && (
            <button onClick={() => handleInputChange('')}
              className="px-3 rounded-xl text-[#4b4859] hover:text-white hover:bg-[#2a2836] transition-all cursor-pointer">✕</button>
          )}
        </div>
        {decoded.error && <p className="text-xs text-[#e57373] mt-2">{decoded.error}</p>}

        {shellTrail.length > 1 && (
          <div className="mt-4 border border-[#2a2836] rounded-xl bg-[#13121a] px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-[#6b6479] mb-2">
              Layer trail
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {shellTrail.map((item, i) => (
                <div key={`${item.depth}-${i}-${item.carrier}`} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-[#4b4859]">→</span>}
                  <button
                    onClick={() => jumpToTrailItem(item)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition-all cursor-pointer ${
                      stack.length === item.depth + 1
                        ? 'border-[#7c3aed]/70 bg-[#241d35] text-white'
                        : 'border-[#2a2836] bg-[#1c1b24] text-[#9d99aa] hover:border-[#4b4859] hover:text-white'
                    }`}
                    title={`${item.partCount} part${item.partCount !== 1 ? 's' : ''}`}
                    aria-label={`Open layer ${item.depth + 1} ${item.carrier}`}
                  >
                    <span className="text-base leading-none">{item.carrier}</span>
                    <span>{item.depth + 1}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mode */}
        {current && (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex bg-[#13121a] rounded-lg p-0.5 border border-[#2a2836] gap-0.5">
              {(['chapter', 'oneshot'] as PlayMode[]).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer ${mode === m ? 'bg-[#7c3aed] text-white' : 'text-[#6b6479] hover:text-white'}`}>
                  {m === 'chapter' ? '▶ Chapter' : '⚡ One-shot'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation breadcrumb */}
      {stack.length > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => { setNestedStack([]); setChapter(1) }}
            className="text-[#6b6479] hover:text-white cursor-pointer transition-colors">outer</button>
          {stack.slice(1).map((s, i) => (
            <span key={i} className="flex items-center gap-2 text-[#6b6479]">
              <span>›</span>
              <span className="text-white">{s.carrier}</span>
            </span>
          ))}
          <button onClick={goBack}
            className="ml-auto text-xs text-[#6b6479] hover:text-white cursor-pointer border border-[#2a2836] hover:border-[#4b4859] px-2 py-0.5 rounded-lg transition-all">
            ← back
          </button>
        </div>
      )}

      {/* Content */}
      {visibleParts.length > 0 && (
        <div className="bg-[#1c1b24] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs text-[#6b6479] font-semibold uppercase tracking-widest mb-1">
            <span className="text-xl">{current?.carrier}</span>
            <span>shell contents</span>
            {mode === 'chapter' && current && (
              <span className="ml-auto normal-case font-normal">
                {visibleParts.length} / {orderedParts.length}
              </span>
            )}
          </div>

          {visibleParts.map((part, i) => (
            <div key={i} className="animate-fade-in">
              <PartRenderer part={part} onOpenShell={openShell} />
            </div>
          ))}
        </div>
      )}

      {/* Chapter navigation */}
      {current && mode === 'chapter' && visibleParts.length > 0 && (
        <div className="flex justify-center">
          {hasMore ? (
            <button
              onClick={() => setChapter(c => c + 1)}
              className="px-6 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] rounded-xl text-sm text-white font-medium cursor-pointer transition-all"
            >
              Next →
            </button>
          ) : isDone && (
            <div className="text-xs text-[#4b4859] py-2">✦ End of shell</div>
          )}
        </div>
      )}
    </div>
  )
}
