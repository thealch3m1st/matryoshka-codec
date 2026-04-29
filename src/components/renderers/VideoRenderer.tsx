export function VideoRenderer({ content, mime, label }: { content: string; mime?: string; label?: string }) {
  const src = content.startsWith('data:') ? content : `data:${mime ?? 'video/mp4'};base64,${content}`
  return (
    <div className="space-y-1">
      {label && <p className="text-xs text-[#6b6479]">{label}</p>}
      <video controls className="w-full rounded-xl max-h-[400px] bg-black">
        <source src={src} type={mime} />
        Your browser does not support video playback.
      </video>
    </div>
  )
}
