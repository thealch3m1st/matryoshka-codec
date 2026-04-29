import { type Part, type ShellPayload, inferLegacyPart } from './types.ts'

// ─── Variation selector codec ─────────────────────────────────────────────────
const VS_START  = 0xfe00
const VS_END    = 0xfe0f
const VSS_START = 0xe0100
const VSS_END   = 0xe01ef

function byteToVS(byte: number): string {
  if (byte < 16)  return String.fromCodePoint(VS_START + byte)
  if (byte < 256) return String.fromCodePoint(VSS_START + byte - 16)
  throw new Error(`Invalid byte: ${byte}`)
}

function vsToByte(cp: number): number | null {
  if (cp >= VS_START  && cp <= VS_END)  return cp - VS_START
  if (cp >= VSS_START && cp <= VSS_END) return cp - VSS_START + 16
  return null
}

function normalizeCarrier(carrier: string): string {
  const cleaned = carrier.trim().replace(/[\uFE00-\uFE0F\u{E0100}-\u{E01EF}]/gu, '')
  if (!cleaned) return '🪆'
  const chars = [...cleaned]
  const end = carrierEnd(chars, 0)
  return chars.slice(0, end).join('') || '🪆'
}

// ─── Low-level encode / decode ────────────────────────────────────────────────

/** Encode a UTF-8 string as variation selectors appended to a carrier char. */
export function encodeRaw(carrier: string, payload: string): string {
  const bytes = new TextEncoder().encode(payload)
  let result = normalizeCarrier(carrier)
  for (const byte of bytes) result += byteToVS(byte)
  return result
}

/** Extract the carrier and hidden UTF-8 payload from an encoded string. */
export function decodeRaw(input: string): { carrier: string; payload: string } | null {
  const chars = [...input]
  if (!chars.length) return null
  let carrier = ''
  const bytes: number[] = []
  let started = false
  for (let i = 0; i < chars.length; i++) {
    const byte = vsToByte(chars[i].codePointAt(0)!)
    if (byte !== null) { started = true; bytes.push(byte) }
    else if (started) break
    else carrier += chars[i]
  }
  if (!started) return null
  return { carrier: carrier || chars[0], payload: new TextDecoder().decode(new Uint8Array(bytes)) }
}

// ─── Shell schema encode / decode ─────────────────────────────────────────────
//
// Encoding strategy (v2):
//   If this shell nests an inner shell → payload = [inner-shell-string][JSON of other parts]
//   The inner shell comes FIRST so any naive VS decoder (e.g. paulgb/emoji-encoder)
//   sees an emoji as the first decoded character, not raw JSON.
//
//   If this shell is a leaf (no nested shell) → payload = JSON as before (v1).

/** Encode a ShellPayload into a carrier emoji. */
export function encodeShell(carrier: string, payload: ShellPayload): string {
  const shellParts  = payload.parts.filter(p => p.t === 'shell')
  const otherParts  = payload.parts.filter(p => p.t !== 'shell')

  if (shellParts.length === 0) {
    // Leaf: pure JSON (v1)
    return encodeRaw(carrier, JSON.stringify({ v: 1, parts: otherParts }))
  }

  // Inner shell first (raw), then JSON metadata for the other parts of THIS shell
  const innerRaw = shellParts[0].c          // already an encoded emoji+VS string
  const metaSuffix = otherParts.length > 0
    ? JSON.stringify({ v: 1, parts: otherParts })
    : ''
  return encodeRaw(carrier, innerRaw + metaSuffix)
}

/** Decode an encoded string into carrier + ShellPayload (handles v1 JSON and v2 raw-first). */
export function decodeShell(input: string): { carrier: string; payload: ShellPayload } | null {
  const raw = decodeRaw(input.trim())
  if (!raw) return null

  const p = raw.payload

  // ── v1 / legacy: payload starts with JSON ──────────────────────────────────
  if (p.trimStart().startsWith('{')) {
    try {
      const parsed = JSON.parse(p) as ShellPayload
      if (parsed.v === 1 && Array.isArray(parsed.parts)) {
        return { carrier: raw.carrier, payload: parsed }
      }
    } catch { /* fall through */ }
    // Couldn't parse JSON — treat as plain text
    return { carrier: raw.carrier, payload: { v: 1, parts: [inferLegacyPart(p)] } }
  }

  // ── v2: inner shell is the raw prefix ──────────────────────────────────────
  const spans = scanSpans(p)
  const parts: Part[] = []

  for (const span of spans) {
    if (span.type === 'encoded') {
      // This IS the inner shell (raw emoji + VS chars)
      parts.push({ t: 'shell', c: span.value })
    } else {
      const text = span.value
      if (text.trimStart().startsWith('{')) {
        // JSON metadata: the other parts of this shell
        try {
          const meta = JSON.parse(text) as ShellPayload
          if (Array.isArray(meta.parts)) {
            parts.push(...meta.parts)
            continue
          }
        } catch { /* treat as plain text */ }
      }
      if (text.trim()) parts.push(inferLegacyPart(text))
    }
  }

  if (parts.length === 0) {
    return { carrier: raw.carrier, payload: { v: 1, parts: [inferLegacyPart(p)] } }
  }

  return { carrier: raw.carrier, payload: { v: 1, parts } }
}

// ─── Multi-shell scanner ───────────────────────────────────────────────────────
// Find all encoded shells embedded within a decoded payload string.

export interface Span {
  type: 'text' | 'encoded'
  value: string          // raw substring
}

/**
 * Split a string into plain-text spans and encoded-shell spans.
 * An encoded shell is: any non-VS character followed by 1+ VS characters.
 */
export function scanSpans(input: string): Span[] {
  const chars = [...input]
  const spans: Span[] = []
  let i = 0
  let text = ''

  while (i < chars.length) {
    const cp = chars[i].codePointAt(0)!
    const isVS = vsToByte(cp) !== null

    if (isVS) {
      // Stray VS with no carrier — skip (shouldn't happen in well-formed input)
      i++
      continue
    }

    const carrierEndIndex = carrierEnd(chars, i)
    const nextCp = carrierEndIndex < chars.length ? chars[carrierEndIndex].codePointAt(0)! : null
    if (nextCp !== null && vsToByte(nextCp) !== null) {
      if (text) {
        spans.push({ type: 'text', value: text })
        text = ''
      }
      // This is a carrier — collect it + all following VS chars
      let encoded = chars.slice(i, carrierEndIndex).join('')
      i = carrierEndIndex
      while (i < chars.length && vsToByte(chars[i].codePointAt(0)!) !== null) {
        encoded += chars[i]
        i++
      }
      spans.push({ type: 'encoded', value: encoded })
    } else {
      text += chars[i]
      i++
    }
  }

  if (text) spans.push({ type: 'text', value: text })

  return spans
}

function carrierEnd(chars: string[], start: number): number {
  let end = start + 1
  const first = chars[start]?.codePointAt(0) ?? 0

  if (isRegionalIndicator(first)) {
    const second = chars[start + 1]?.codePointAt(0) ?? 0
    return isRegionalIndicator(second) ? start + 2 : end
  }

  if (isSkinTone(chars[end]?.codePointAt(0) ?? 0)) end += 1

  while (chars[end] === '\u200d' && end + 1 < chars.length) {
    end += 2
    if (isSkinTone(chars[end]?.codePointAt(0) ?? 0)) end += 1
  }

  if (chars[end] === '\u20e3') end += 1

  return end
}

function isRegionalIndicator(cp: number): boolean {
  return cp >= 0x1f1e6 && cp <= 0x1f1ff
}

function isSkinTone(cp: number): boolean {
  return cp >= 0x1f3fb && cp <= 0x1f3ff
}

// ─── Byte size helpers ────────────────────────────────────────────────────────

/** Count how many bytes will be encoded (UTF-8 byte length of JSON payload). */
export function shellByteSize(payload: ShellPayload): number {
  return new TextEncoder().encode(JSON.stringify(payload)).length
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}
