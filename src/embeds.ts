export type EmbedType =
  | 'youtube'
  | 'spotify'
  | 'soundcloud'
  | 'vimeo'
  | 'applemusic'
  | 'bandcamp'
  | 'suno'
  | 'none'

export interface Embed {
  type: EmbedType
  src: string
  href?: string
  id?: string
  needsResolve?: boolean
}

export const SUNO_SHORTLINKS: Record<string, string> = {
  BbMKt9iy1tWBN1Rz: '10b00119-e257-4a01-81a8-e72eb744e106',
}

export function getEmbed(url: string): Embed {
  try {
    const u = new URL(url)

    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (ytMatch) return { type: 'youtube', src: `https://www.youtube.com/embed/${ytMatch[1]}` }

    if (u.hostname.includes('spotify.com')) {
      const src = url.replace('https://open.spotify.com/', 'https://open.spotify.com/embed/')
      return { type: 'spotify', src }
    }

    if (u.hostname.includes('soundcloud.com')) {
      const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%237c3aed&auto_play=false&show_artwork=true`
      return { type: 'soundcloud', src }
    }

    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) return { type: 'vimeo', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` }

    if (u.hostname.includes('music.apple.com')) {
      const src = url.replace('https://music.apple.com/', 'https://embed.music.apple.com/')
      return { type: 'applemusic', src }
    }

    if (u.hostname.includes('bandcamp.com')) {
      return { type: 'bandcamp', src: url }
    }

    const sunoSongMatch = url.match(/suno\.com\/song\/([\w-]+)/)
    if (sunoSongMatch) {
      return { type: 'suno', src: `https://suno.com/embed/${sunoSongMatch[1]}`, href: url, id: sunoSongMatch[1] }
    }

    const sunoShortMatch = url.match(/suno\.com\/s\/([\w-]+)/)
    if (sunoShortMatch) {
      const resolvedId = SUNO_SHORTLINKS[sunoShortMatch[1]]
      return {
        type: 'suno',
        src: resolvedId ? `https://suno.com/embed/${resolvedId}` : '',
        href: url,
        id: resolvedId,
        needsResolve: !resolvedId,
      }
    }

  } catch {
    // Invalid URLs fall through to a normal link.
  }

  return { type: 'none', src: url }
}
