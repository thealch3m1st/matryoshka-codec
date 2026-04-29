export function ImageRenderer({ content, mime, label }: { content: string; mime?: string; label?: string }) {
  const src = content.startsWith('data:') ? content : `data:${mime ?? 'image/png'};base64,${content}`
  return (
    <div className="space-y-1">
      <img
        src={src}
        alt={label ?? 'image'}
        className="w-full rounded-xl object-contain max-h-[400px] bg-[#13121a]"
      />
      {label && <p className="text-xs text-[#6b6479] text-center">{label}</p>}
    </div>
  )
}
