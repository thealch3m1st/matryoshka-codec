export function AudioRenderer({ content, mime, label }: { content: string; mime?: string; label?: string }) {
  const src = content.startsWith('data:') ? content : `data:${mime ?? 'audio/mpeg'};base64,${content}`
  return (
    <div className="space-y-1">
      {label && <p className="text-xs text-[#6b6479]">{label}</p>}
      <audio
        controls
        className="w-full"
        style={{ accentColor: '#7c3aed' }}
      >
        <source src={src} type={mime} />
        Your browser does not support audio playback.
      </audio>
    </div>
  )
}
