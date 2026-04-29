export function TextRenderer({ content }: { content: string }) {
  return (
    <p className="text-white text-base leading-relaxed whitespace-pre-wrap break-words">
      {content}
    </p>
  )
}
