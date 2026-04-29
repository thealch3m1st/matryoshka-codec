import { useEffect, useMemo, useState } from 'react'

interface VoiceRendererProps {
  content: string
  voiceStyle?: string
  rate?: number
  pitch?: number
  label?: string
}

const VOICE_STYLES: Record<string, { label: string; rate: number; pitch: number }> = {
  warm: { label: 'Warm', rate: 0.92, pitch: 1.02 },
  bright: { label: 'Bright', rate: 1.02, pitch: 1.14 },
  hush: { label: 'Hush', rate: 0.78, pitch: 0.82 },
  robot: { label: 'Robot', rate: 0.88, pitch: 0.55 },
}

export function VoiceRenderer({ content, voiceStyle = 'warm', rate, pitch, label }: VoiceRendererProps) {
  const [speaking, setSpeaking] = useState(false)
  const [supported] = useState(() => 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window)
  const settings = useMemo(() => VOICE_STYLES[voiceStyle] ?? VOICE_STYLES.warm, [voiceStyle])

  useEffect(() => {
    return () => window.speechSynthesis?.cancel()
  }, [])

  const speak = () => {
    if (!supported) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(content)
    utterance.rate = rate ?? settings.rate
    utterance.pitch = pitch ?? settings.pitch
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  const stop = () => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  return (
    <div className="rounded-xl border border-[#2a2836] bg-[#13121a] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#6b6479]">
            {label || 'Tiny voice'}
          </div>
          <div className="mt-1 text-xs text-[#4b4859]">{settings.label} voice recipe</div>
        </div>
        <button
          onClick={speaking ? stop : speak}
          disabled={!supported}
          className="shrink-0 rounded-xl bg-[#7c3aed] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {speaking ? 'Stop' : 'Speak'}
        </button>
      </div>
      <p className="whitespace-pre-wrap break-words text-base leading-relaxed text-white">{content}</p>
      {!supported && (
        <div className="mt-3 text-xs text-[#e57373]">
          Speech playback is unavailable in this browser.
        </div>
      )}
    </div>
  )
}
