import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { getEmbed, type Embed } from '../../embeds'

export function UrlRenderer({ url, label }: { url: string; label?: string }) {
  const embed = useMemo(() => getEmbed(url), [url])
  const displayLabel = label?.trim()

  if (embed.type === 'youtube') {
    return withOptionalLabel(
      <div className="w-full aspect-video rounded-xl overflow-hidden">
        <iframe
          src={embed.src}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>,
      displayLabel,
    )
  }

  if (embed.type === 'spotify') {
    return withOptionalLabel(
      <iframe
        src={embed.src}
        className="w-full rounded-xl"
        height="152"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />,
      displayLabel,
    )
  }

  if (embed.type === 'soundcloud') {
    return withOptionalLabel(
      <iframe
        src={embed.src}
        className="w-full rounded-xl"
        height="120"
        scrolling="no"
        allow="autoplay"
      />,
      displayLabel,
    )
  }

  if (embed.type === 'vimeo') {
    return withOptionalLabel(
      <div className="w-full aspect-video rounded-xl overflow-hidden">
        <iframe
          src={embed.src}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>,
      displayLabel,
    )
  }

  if (embed.type === 'applemusic') {
    return withOptionalLabel(
      <iframe
        src={embed.src}
        className="w-full rounded-xl"
        height="175"
        allow="autoplay *; encrypted-media *; fullscreen *"
        sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
      />,
      displayLabel,
    )
  }

  if (embed.type === 'bandcamp') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-3 bg-[#1da0c3]/10 border border-[#1da0c3]/30 rounded-xl text-[#9d99aa] hover:text-white transition-all text-sm break-all">
        <span className="shrink-0">🎵</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-white">{displayLabel || 'Bandcamp'}</span>
          <span className="block truncate text-xs text-[#6b6479]">{url}</span>
        </span>
        <span className="ml-auto text-xs shrink-0">Bandcamp ↗</span>
      </a>
    )
  }

  if (embed.type === 'suno') {
    return <SunoRenderer key={url} embed={embed} url={url} label={displayLabel} />
  }

  // Generic link
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-4 py-3 bg-[#13121a] border border-[#2a2836] rounded-xl text-[#9d99aa] hover:text-white hover:border-[#4b4859] transition-all text-sm break-all"
    >
      <span className="shrink-0">🔗</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-white">{displayLabel || url}</span>
        {displayLabel && <span className="block truncate text-xs text-[#6b6479]">{url}</span>}
      </span>
    </a>
  )
}

function withOptionalLabel(content: ReactNode, label?: string) {
  if (!label) return content
  return (
    <div className="space-y-2">
      <div className="truncate text-xs font-semibold uppercase tracking-widest text-[#6b6479]">
        {label}
      </div>
      {content}
    </div>
  )
}

function SunoRenderer({ embed, url, label }: { embed: Embed; url: string; label?: string }) {
  const [resolved, setResolved] = useState(embed)
  const [message, setMessage] = useState(embed.needsResolve ? 'Resolving Suno short link...' : '')

  useEffect(() => {
    let active = true

    if (!embed.needsResolve) {
      return () => {
        active = false
      }
    }

    fetch(`/api/suno/resolve?url=${encodeURIComponent(url)}`)
      .then(async response => {
        const contentType = response.headers.get('content-type') ?? ''
        if (!contentType.includes('application/json')) {
          throw new Error('Suno resolver route unavailable locally.')
        }
        const data = await response.json() as { id?: string; embedSrc?: string; error?: string; hint?: string }
        if (!response.ok || !data.embedSrc) throw new Error(data.error ?? data.hint ?? 'Could not resolve Suno short link.')
        return data
      })
      .then(data => {
        if (!active) return
        setResolved({ ...embed, id: data.id, src: data.embedSrc ?? '', needsResolve: false })
        setMessage('')
      })
      .catch(error => {
        if (!active) return
        setMessage(error instanceof Error ? error.message : 'Could not resolve Suno short link.')
      })

    return () => {
      active = false
    }
  }, [embed, url])

  if (resolved.src) {
    return withOptionalLabel(
      <div className="overflow-hidden rounded-xl border border-[#2a2836] bg-[#13121a]">
        <iframe
          src={resolved.src}
          className="w-full"
          height="240"
          allow="autoplay; clipboard-write; encrypted-media"
          style={{ border: 'none' }}
        />
      </div>,
      label,
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-[#2a2836] bg-[#13121a] px-4 py-3 text-sm text-[#9d99aa] transition-all hover:border-[#4b4859] hover:text-white"
    >
      <span className="text-xl">🎵</span>
      <span className="min-w-0 flex-1">
        <span className="block text-white">{label || 'Suno song'}</span>
        <span className="block truncate text-xs text-[#6b6479]">{message || url}</span>
      </span>
      <span className="text-xs">Open ↗</span>
    </a>
  )
}
