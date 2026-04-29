import { useState, useCallback, useRef } from 'react'
import { encodeShell, formatBytes } from '../encoding'
import { ROMANTIC_MIXTAPE_EXAMPLE, ROMANTIC_MIXTAPE_SHELLS } from '../examples'
import { type Part, type ShellPayload, type PartType, mimeToPartType, partTypeIcon, partTypeLabel } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Shell {
  id: number
  carrier: string
  parts: Part[]
}

const FAVORITE_EMOJI = [
  '💌','✨','🚀','💜','🌙','🔮','🌸','🦋','🎁','🌟','💫','🍀',
  '🌈','🔑','💎','🫀','🪄','🌺','👁️','🐚','🧿','🎭','🕊️','🪆',
  '🎵','🎬','📸','🌊','🔥','❄️','🌿','🦚',
]

const STANDARD_EMOJI = [
  ...emojiRange(0x1F300, 0x1F5FF),
  ...emojiRange(0x1F600, 0x1F64F),
  ...emojiRange(0x1F680, 0x1F6FF),
  ...emojiRange(0x1F700, 0x1F77F),
  ...emojiRange(0x1F780, 0x1F7FF),
  ...emojiRange(0x1F800, 0x1F8FF),
  ...emojiRange(0x1F900, 0x1F9FF),
  ...emojiRange(0x1FA70, 0x1FAFF),
  ...emojiRange(0x2600, 0x27BF),
  ...flagEmoji(),
]

let uid = 1
const nextId = () => uid++

const makeShell = (carrier = '💌'): Shell => ({ id: nextId(), carrier, parts: [] })

// ─── Root component ───────────────────────────────────────────────────────────

export function Encoder() {
  // shells[0] = outermost, shells[last] = innermost
  const [shells, setShells] = useState<Shell[]>([])
  const [activeShell, setActiveShell] = useState<number>(0) // index of shell being edited
  const [copied, setCopied] = useState(false)
  const [exampleCopied, setExampleCopied] = useState(false)
  const [choosingFirstShell, setChoosingFirstShell] = useState(false)

  const updateShell = (id: number, patch: Partial<Shell>) =>
    setShells(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))

  const addShellOutside = () => {
    const s = makeShell('🌙')
    setShells(prev => [s, ...prev])
    setActiveShell(0)
  }

  const addShellInside = () => {
    const s = makeShell('💫')
    setShells(prev => [...prev, s])
    setActiveShell(shells.length)
  }

  const addFirstShell = (carrier: string) => {
    const s = makeShell(carrier)
    setShells([s])
    setActiveShell(0)
    setChoosingFirstShell(false)
  }

  const removeShell = (id: number) => {
    setShells(prev => {
      const next = prev.filter(s => s.id !== id)
      return next
    })
    setActiveShell(prev => Math.max(0, Math.min(prev, shells.length - 2)))
  }

  // Build from inside out
  const buildResult = useCallback((): string => {
    if (!shells.some(shell => shell.parts.length > 0)) return ''
    if (!shells.length) return ''
    // Start with the innermost shell's payload encoded into its carrier
    let current = encodeShell(shells[shells.length - 1].carrier, { v: 1, parts: shells[shells.length - 1].parts })
    // Wrap outward — each shell's payload includes the inner result as a 'shell' part
    for (let i = shells.length - 2; i >= 0; i--) {
      const payload: ShellPayload = {
        v: 1,
        parts: [
          ...shells[i].parts,
          { t: 'shell', c: current },
        ]
      }
      current = encodeShell(shells[i].carrier, payload)
    }
    return current
  }, [shells])

  const result = buildResult()
  const invisibleChars = Math.max(0, [...result].length - 1)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyExample = async () => {
    await navigator.clipboard.writeText(ROMANTIC_MIXTAPE_EXAMPLE)
    setExampleCopied(true)
    setTimeout(() => setExampleCopied(false), 2000)
  }

  const loadExample = () => {
    setShells(ROMANTIC_MIXTAPE_SHELLS.map(shell => ({
      id: nextId(),
      carrier: shell.carrier,
      parts: shell.parts.map(part => ({ ...part })),
    })))
    setActiveShell(0)
    setCopied(false)
  }

  const active = shells[activeShell]

  return (
    <div className="space-y-4">
      {/* Example */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#2a2836] bg-[#15141c] px-3 py-2 text-xs">
        <span className="text-base leading-none">{[...ROMANTIC_MIXTAPE_EXAMPLE][0]}</span>
        <span className="font-medium text-white">Romantic mixtape</span>
        <span className="min-w-0 flex-1 truncate text-[#6b6479]">Text → Suno → Tiny Voice → note</span>
        <div className="flex gap-1">
          <button
            onClick={handleCopyExample}
            className="rounded-lg bg-[#7c3aed] px-2.5 py-1 font-medium text-white transition-colors hover:bg-[#6d28d9]"
          >
            {exampleCopied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={loadExample}
            className="rounded-lg border border-[#2a2836] px-2.5 py-1 font-medium text-[#9d99aa] transition-colors hover:border-[#4b4859] hover:text-white"
          >
            Load
          </button>
        </div>
      </div>

      {/* Shell stack */}
      <div className="bg-[#1c1b24] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#6b6479]">
            Shells · outer → inner
          </span>
          <span className="text-xs text-[#6b6479]">{shells.length} shell{shells.length !== 1 ? 's' : ''}</span>
        </div>

        {shells.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#2a2836] bg-[#13121a] px-4 py-6 text-center">
            <div className="text-sm font-medium text-white">No shells yet</div>
            <div className="mt-1 text-xs text-[#6b6479]">Choose an emoji carrier, then add content.</div>
            <div className="relative mt-4 inline-block">
              <button onClick={() => setChoosingFirstShell(value => !value)} className={confirmBtn}>
                Choose shell emoji
              </button>
              {choosingFirstShell && (
                <EmojiPicker
                  current=""
                  onPick={addFirstShell}
                  onClose={() => setChoosingFirstShell(false)}
                />
              )}
            </div>
          </div>
        ) : (
          <>
            <button onClick={addShellOutside} className={addBtnCls}>+ add outer shell</button>

            <div className="space-y-1 my-1">
              {shells.map((shell, i) => (
                <ShellRow
                  key={shell.id}
                  shell={shell}
                  index={i}
                  total={shells.length}
                  isActive={activeShell === i}
                  onClick={() => setActiveShell(i)}
                  onCarrierChange={c => updateShell(shell.id, { carrier: c })}
                  onRemove={() => removeShell(shell.id)}
                />
              ))}
            </div>

            <button onClick={addShellInside} className={addBtnCls}>+ add inner shell</button>
          </>
        )}
      </div>

      {/* Active shell part editor */}
      {active && (
        <PartEditor
          key={active.id}
          shell={active}
          label={activeShell === 0 ? 'outermost' : activeShell === shells.length - 1 ? 'innermost' : `shell ${activeShell + 1}`}
          onChange={parts => updateShell(active.id, { parts })}
        />
      )}

      {/* Result */}
      <div className="bg-[#1c1b24] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#6b6479]">Result</span>
          <span className="text-xs text-[#4b4859]">≈ {formatBytes(invisibleChars)} · {invisibleChars} VS chars</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-[#13121a] rounded-xl px-4 py-3 text-3xl min-h-[56px] flex items-center select-all">
            {result ? [...result][0] : <span className="text-[#4b4859] text-sm">—</span>}
          </div>
          <button
            onClick={handleCopy}
            disabled={!result}
            className="shrink-0 px-5 py-3 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-40 text-sm font-medium text-white transition-all cursor-pointer"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-[#4b4859] mt-2">
          {result
            ? `Looks like a single emoji. Contains ${shells.length} nested shell${shells.length !== 1 ? 's' : ''}.`
            : 'Empty until you add content.'}
        </p>
      </div>
    </div>
  )
}

// ─── Shell row ────────────────────────────────────────────────────────────────

function ShellRow({ shell, index, total, isActive, onClick, onCarrierChange, onRemove }: {
  shell: Shell; index: number; total: number
  isActive: boolean; onClick: () => void
  onCarrierChange: (c: string) => void; onRemove: () => void
}) {
  const [picking, setPicking] = useState(false)
  const indent = Math.min(index * 14, 56)

  return (
    <div style={{ marginLeft: indent }} className="relative">
      {index > 0 && <div className="absolute left-4 -top-1 w-px h-2 bg-[#2a2836]" />}
      <div
        onClick={onClick}
        className={`flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer transition-all border ${
          isActive
            ? 'bg-[#1e1a2e] border-[#7c3aed]/60'
            : 'bg-[#13121a] border-[#2a2836] hover:border-[#3d3a4a]'
        }`}
      >
        {/* Carrier emoji */}
        <div className="relative">
          <button
            onClick={e => { e.stopPropagation(); setPicking(p => !p) }}
            className="text-2xl w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#2a2836] transition-colors cursor-pointer"
          >
            {shell.carrier}
          </button>
          {picking && (
            <EmojiPicker
              current={shell.carrier}
              onPick={c => { onCarrierChange(c); setPicking(false) }}
              onClose={() => setPicking(false)}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs text-[#6b6479]">
            {index === 0 ? 'outermost · ' : index === total - 1 ? 'innermost · ' : ''}
            shell {index + 1}
          </div>
          <div className="text-xs text-[#4b4859] truncate">
            {shell.parts.length
              ? shell.parts.map(p => partTypeIcon(p.t)).join(' ')
              : 'no content yet'}
            {index < total - 1 ? ' + inner shell →' : ''}
          </div>
        </div>

        <button
          onClick={e => { e.stopPropagation(); onRemove() }}
          className="text-[#4b4859] hover:text-[#e57373] transition-colors text-sm w-6 h-6 flex items-center justify-center cursor-pointer"
        >✕</button>
      </div>
    </div>
  )
}

// ─── Part editor ──────────────────────────────────────────────────────────────

// Types the user picks from
const PART_TYPES: { t: PartType; label: string; icon: string; hint?: string }[] = [
  { t: 'text',  label: 'Text',   icon: '✦' },
  { t: 'voice', label: 'Tiny Voice', icon: '🎙️', hint: 'Speech → text → speech' },
  { t: 'audio', label: 'Music',  icon: '🎵', hint: 'Spotify · SoundCloud · file' },
  { t: 'video', label: 'Video',  icon: '🎬', hint: 'YouTube · Vimeo · file' },
  { t: 'image', label: 'Image',  icon: '🖼️' },
  { t: 'url',   label: 'Link',   icon: '🔗' },
]

// Stream-friendly URL patterns
const STREAM_PROVIDERS: Record<string, { name: string; placeholder: string }> = {
  audio: {
    name: 'Spotify, SoundCloud, Apple Music, Bandcamp…',
    placeholder: 'https://open.spotify.com/track/… or soundcloud.com/…',
  },
  video: {
    name: 'YouTube, Vimeo, Twitch…',
    placeholder: 'https://youtu.be/… or vimeo.com/…',
  },
}

function PartEditor({ shell, label, onChange }: {
  shell: Shell; label: string; onChange: (parts: Part[]) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [addingType, setAddingType] = useState<PartType | null>(null)
  // For stream+file types, track sub-mode
  const [inputMode, setInputMode] = useState<'stream' | 'file'>('stream')
  const [textInput,  setTextInput]  = useState('')
  const [urlInput,   setUrlInput]   = useState('')
  const [labelInput, setLabelInput] = useState('')
  const [voiceStyle, setVoiceStyle] = useState('warm')

  const addPart  = (part: Part) => onChange([...shell.parts, part])
  const removePart = (i: number) => onChange(shell.parts.filter((_, idx) => idx !== i))

  const cancel = () => {
    setAddingType(null); setInputMode('stream')
    setTextInput(''); setUrlInput(''); setLabelInput('')
    setVoiceStyle('warm')
  }

  const commitText = () => {
    if (!textInput.trim()) return
    addPart({ t: 'text', c: textInput.trim() })
    cancel()
  }

  const commitVoice = () => {
    if (!textInput.trim()) return
    addPart({ t: 'voice', c: textInput.trim(), v: voiceStyle, l: labelInput || undefined })
    cancel()
  }

  const commitUrl = () => {
    if (!urlInput.trim()) return
    addPart({ t: 'url', c: urlInput.trim(), l: labelInput || undefined })
    cancel()
  }

  // For audio/video stream URLs — store as 'url' type so UrlRenderer embeds them
  const commitStream = () => {
    if (!urlInput.trim()) return
    addPart({ t: 'url', c: urlInput.trim(), l: labelInput || undefined })
    cancel()
  }

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const mime = file.type || 'application/octet-stream'
      const base64 = dataUrl.split(',')[1]
      const t = mimeToPartType(mime)
      if (!t) return
      addPart({ t, c: base64, m: mime, n: file.name, l: labelInput || undefined })
      cancel()
    }
    reader.readAsDataURL(file)
  }

  const hasStreamMode = addingType === 'audio' || addingType === 'video'
  const voiceBytes = textInput.trim()
    ? new TextEncoder().encode(JSON.stringify({ t: 'voice', c: textInput.trim(), v: voiceStyle })).length
    : 0

  return (
    <div className="bg-[#1c1b24] rounded-2xl p-5">
      <div className="text-xs font-semibold uppercase tracking-widest text-[#6b6479] mb-1">
        {shell.carrier} {label} — content
      </div>
      <p className="text-xs text-[#4b4859] mb-4">
        What's hidden inside this shell. Can be text, media, links — anything.
      </p>

      {/* Existing parts */}
      {shell.parts.length > 0 && (
        <div className="space-y-2 mb-4">
          {shell.parts.map((part, i) => (
            <div key={i} className="flex items-start gap-2 bg-[#13121a] rounded-xl px-3 py-2 border border-[#2a2836]">
              <span className="text-lg mt-0.5">{partTypeIcon(part.t)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[#6b6479]">{partTypeLabel(part.t)}</div>
                <div className="text-sm text-white truncate">
                  {part.t === 'text' || part.t === 'voice'
                    ? part.c
                    : part.t === 'url' ? part.c : part.n ?? part.m ?? 'binary data'}
                </div>
              </div>
              <button onClick={() => removePart(i)} className="text-[#4b4859] hover:text-[#e57373] cursor-pointer text-sm">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* ── Type picker ── */}
      {!addingType && (
        <div>
          <div className="text-xs text-[#4b4859] mb-2">Add content</div>
          <div className="flex flex-wrap gap-1">
            {PART_TYPES.map(({ t, label: lbl, icon, hint }) => (
              <button
                key={t}
                onClick={() => { setAddingType(t); setInputMode('stream') }}
                className="flex flex-col items-start px-3 py-2 bg-[#13121a] border border-[#2a2836] rounded-xl text-xs text-[#9d99aa] hover:text-white hover:border-[#4b4859] transition-all cursor-pointer"
              >
                <span className="flex items-center gap-1.5"><span>{icon}</span><span className="font-medium">{lbl}</span></span>
                {hint && <span className="text-[#4b4859] mt-0.5">{hint}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Text input ── */}
      {addingType === 'text' && (
        <div className="space-y-2">
          <textarea autoFocus value={textInput} onChange={e => setTextInput(e.target.value)}
            placeholder="Type your message…" rows={3}
            className={inputCls + ' resize-none'} />
          <div className="flex gap-2">
            <button onClick={commitText} className={confirmBtn}>Add text</button>
            <button onClick={cancel} className={cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Tiny voice: speech-to-text recipe ── */}
      {addingType === 'voice' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {VOICE_STYLES.map(style => (
              <button
                key={style.id}
                onClick={() => setVoiceStyle(style.id)}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition-all ${
                  voiceStyle === style.id
                    ? 'border-[#7c3aed]/70 bg-[#241d35] text-white'
                    : 'border-[#2a2836] bg-[#13121a] text-[#9d99aa] hover:border-[#4b4859] hover:text-white'
                }`}
              >
                <span className="block font-medium">{style.label}</span>
                <span className="mt-0.5 block text-[#4b4859]">{style.hint}</span>
              </button>
            ))}
          </div>
          <textarea
            autoFocus
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder="Type what the tiny voice should say…"
            rows={4}
            className={inputCls + ' resize-none'}
          />
          <input
            type="text"
            value={labelInput}
            onChange={e => setLabelInput(e.target.value)}
            placeholder="Label (optional)"
            className={inputCls}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={commitVoice} disabled={!textInput.trim()} className={confirmBtn + ' disabled:opacity-40'}>
              Add tiny voice
            </button>
            <button onClick={cancel} className={cancelBtn}>Cancel</button>
            <span className="text-xs text-[#4b4859]">
              ≈ {voiceBytes || '—'} B recipe
            </span>
          </div>
        </div>
      )}

      {/* ── Generic link input ── */}
      {addingType === 'url' && (
        <div className="space-y-2">
          <input autoFocus type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
            placeholder="https://…" className={inputCls} />
          <input type="text" value={labelInput} onChange={e => setLabelInput(e.target.value)}
            placeholder="Label (optional)" className={inputCls} />
          <div className="flex gap-2">
            <button onClick={commitUrl} className={confirmBtn}>Add link</button>
            <button onClick={cancel} className={cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Audio / Video: stream URL or file upload ── */}
      {hasStreamMode && (
        <div className="space-y-3">
          {/* Stream / File tabs */}
          <div className="flex bg-[#13121a] rounded-lg p-0.5 border border-[#2a2836] gap-0.5 w-fit">
            {(['stream', 'file'] as const).map(m => (
              <button key={m} onClick={() => setInputMode(m)}
                className={`px-4 py-1.5 rounded-md text-xs transition-all cursor-pointer ${inputMode === m ? 'bg-[#7c3aed] text-white' : 'text-[#6b6479] hover:text-white'}`}>
                {m === 'stream' ? '🔗 Streaming link' : '📁 Upload file'}
              </button>
            ))}
          </div>

          {inputMode === 'stream' ? (
            <div className="space-y-2">
              <p className="text-xs text-[#4b4859]">
                {STREAM_PROVIDERS[addingType!]?.name}
              </p>
              <input autoFocus type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                placeholder={STREAM_PROVIDERS[addingType!]?.placeholder}
                className={inputCls} />
              <input type="text" value={labelInput} onChange={e => setLabelInput(e.target.value)}
                placeholder="Label (optional)" className={inputCls} />
              <div className="flex gap-2">
                <button onClick={commitStream} disabled={!urlInput.trim()} className={confirmBtn + ' disabled:opacity-40'}>
                  Embed
                </button>
                <button onClick={cancel} className={cancelBtn}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <FileDropZone
                icon={addingType === 'audio' ? '🎵' : '🎬'}
                hint={addingType === 'audio' ? 'mp3, ogg, wav, flac, aac, m4a…' : 'mp4, webm…'}
                fileRef={fileRef}
                onFile={handleFile}
              />
              <input type="text" value={labelInput} onChange={e => setLabelInput(e.target.value)}
                placeholder="Label (optional)" className={inputCls} />
              <button onClick={cancel} className={cancelBtn}>Cancel</button>
            </div>
          )}
        </div>
      )}

      {/* ── Image: upload only ── */}
      {addingType === 'image' && (
        <div className="space-y-2">
          <FileDropZone
            icon={partTypeIcon(addingType)}
            hint="png, jpg, gif, webp, svg…"
            fileRef={fileRef}
            onFile={handleFile}
          />
          <input type="text" value={labelInput} onChange={e => setLabelInput(e.target.value)}
            placeholder="Label / caption (optional)" className={inputCls} />
          <button onClick={cancel} className={cancelBtn}>Cancel</button>
        </div>
      )}

      {/* Hidden file input — shared, accept is set per-use */}
      <input ref={fileRef} type="file" className="hidden"
        accept={
          addingType === 'image' ? 'image/*' :
          addingType === 'audio' ? 'audio/*' :
          addingType === 'video' ? 'video/*' : '*'
        }
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
      />
    </div>
  )
}

// ─── File drop zone ───────────────────────────────────────────────────────────

function FileDropZone({ icon, hint, fileRef, onFile }: {
  icon: string; hint: string
  fileRef: React.RefObject<HTMLInputElement | null>
  onFile: (f: File) => void
}) {
  const [dragging, setDragging] = useState(false)
  return (
    <div
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
        dragging ? 'border-[#7c3aed] bg-[#7c3aed]/10' : 'border-[#2a2836] hover:border-[#7c3aed]/50'
      }`}
      onClick={() => fileRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onFile(f) }}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm text-[#9d99aa]">Drop file here or <span className="text-[#7c3aed]">browse</span></div>
      <div className="text-xs text-[#4b4859] mt-1">{hint}</div>
    </div>
  )
}

// ─── Emoji picker ─────────────────────────────────────────────────────────────

function EmojiPicker({ current, onPick, onClose }: {
  current: string; onPick: (e: string) => void; onClose: () => void
}) {
  const [custom, setCustom] = useState('')
  const [showAll, setShowAll] = useState(false)
  const options = showAll ? STANDARD_EMOJI : FAVORITE_EMOJI
  const normalizedCustom = normalizeTypedCarrier(custom)

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute left-0 top-full mt-1 z-20 w-[min(360px,calc(100vw-2rem))] rounded-xl border border-[#2a2836] bg-[#1c1b24] p-3 shadow-2xl">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[#6b6479]">
            Carrier emoji
          </div>
          <button
            onClick={() => setShowAll(value => !value)}
            className="rounded-lg border border-[#2a2836] px-2 py-1 text-xs text-[#9d99aa] transition-colors hover:border-[#4b4859] hover:text-white"
          >
            {showAll ? 'Favorites' : 'All emoji'}
          </button>
        </div>
        <div className="mb-2 grid max-h-64 grid-cols-8 gap-1 overflow-y-auto pr-1">
          {options.map(e => (
            <button key={e} onClick={() => onPick(e)}
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-xl transition-colors ${e === current ? 'bg-[#7c3aed]' : 'hover:bg-[#2a2836]'}`}
              title={e}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <input type="text" value={custom} onChange={e => setCustom(e.target.value)}
            placeholder="or type/paste one…"
            className="flex-1 bg-[#13121a] text-sm rounded-lg px-2 py-1 outline-none text-white placeholder:text-[#4b4859] border border-[#2a2836]" />
          <button
            onClick={() => normalizedCustom && onPick(normalizedCustom)}
            disabled={!normalizedCustom}
            className="cursor-pointer rounded-lg bg-[#7c3aed] px-2 py-1 text-xs text-white hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Use {normalizedCustom}
          </button>
        </div>
      </div>
    </>
  )
}

function emojiRange(start: number, end: number): string[] {
  const emoji: string[] = []
  for (let codePoint = start; codePoint <= end; codePoint += 1) {
    emoji.push(String.fromCodePoint(codePoint))
  }
  return emoji
}

function flagEmoji(): string[] {
  const flags: string[] = []
  for (let first = 0x1F1E6; first <= 0x1F1FF; first += 1) {
    for (let second = 0x1F1E6; second <= 0x1F1FF; second += 1) {
      flags.push(String.fromCodePoint(first, second))
    }
  }
  return flags
}

function normalizeTypedCarrier(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const firstSegment = typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(trimmed))[0]?.segment
    : [...trimmed][0]
  return (firstSegment ?? '').replace(/[\uFE00-\uFE0F\u{E0100}-\u{E01EF}]/gu, '')
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const addBtnCls = 'w-full py-1.5 rounded-lg border border-dashed border-[#2a2836] text-xs text-[#4b4859] hover:text-[#9d99aa] hover:border-[#4b4859] transition-all cursor-pointer my-1'
const confirmBtn = 'px-4 py-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] rounded-lg text-xs text-white font-medium cursor-pointer transition-all'
const cancelBtn  = 'px-4 py-1.5 bg-[#13121a] border border-[#2a2836] hover:border-[#4b4859] rounded-lg text-xs text-[#9d99aa] hover:text-white cursor-pointer transition-all'
const inputCls   = 'w-full bg-[#13121a] border border-[#2a2836] focus:border-[#7c3aed] rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-[#4b4859] transition-colors'

const VOICE_STYLES = [
  { id: 'warm', label: 'Warm', hint: 'soft note' },
  { id: 'bright', label: 'Bright', hint: 'lifted' },
  { id: 'hush', label: 'Hush', hint: 'slow' },
  { id: 'robot', label: 'Robot', hint: 'tiny synth' },
]
