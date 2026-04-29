// ─── Shell Schema v1 ──────────────────────────────────────────────────────────
// A shell is one layer of a matryoshka emoji.
// Its payload is a JSON envelope hiding inside variation selector characters.

export type PartType =
  | 'text'   // plain text
  | 'voice'  // tiny voice recipe: transcript + speech settings
  | 'url'    // any URL — renderer auto-embeds known providers
  | 'image'  // base64 image (png, jpg, gif, webp, svg)
  | 'audio'  // base64 audio (mp3, ogg, wav, flac, aac, mp4 audio)
  | 'video'  // base64 video (mp4, webm)
  | 'shell'  // a nested encoded emoji (carrier + VS chars)

export interface Part {
  t: PartType       // type
  c: string         // content (text/url/base64/encoded-emoji)
  m?: string        // mime type (for binary parts)
  n?: string        // optional filename hint
  l?: string        // optional label / caption
  v?: string        // optional voice/style hint
  r?: number        // optional speech rate
  p?: number        // optional speech pitch
}

export interface ShellPayload {
  v: 1              // schema version
  parts: Part[]
}

// ─── Legacy fallback ──────────────────────────────────────────────────────────
// If payload doesn't parse as ShellPayload JSON, infer type from content.
export function inferLegacyPart(raw: string): Part {
  if (/^https?:\/\//.test(raw.trim())) return { t: 'url',  c: raw.trim() }
  if (/^data:([^;]+);base64,/.test(raw.trim())) {
    const mime = raw.trim().match(/^data:([^;]+);base64,/)![1]
    const c = raw.trim().replace(/^data:[^;]+;base64,/, '')
    const t = mimeToPartType(mime)
    return t ? { t, c, m: mime } : { t: 'url', c: raw.trim() }
  }
  return { t: 'text', c: raw }
}

export function mimeToPartType(mime: string): PartType | null {
  if (mime.startsWith('image/'))  return 'image'
  if (mime.startsWith('video/'))  return 'video'
  if (mime.startsWith('audio/'))  return 'audio'
  return null
}

export function partTypeLabel(t: PartType): string {
  return { text: 'Text', voice: 'Tiny Voice', url: 'Link', image: 'Image', audio: 'Audio',
           video: 'Video', shell: 'Nested shell' }[t]
}

export function partTypeIcon(t: PartType): string {
  return { text: '✦', voice: '🎙️', url: '🔗', image: '🖼️', audio: '🎵',
           video: '🎬', shell: '🪆' }[t]
}
