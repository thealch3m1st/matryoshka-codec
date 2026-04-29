import { type Part } from '../../types'
import { TextRenderer } from './TextRenderer'
import { UrlRenderer } from './UrlRenderer'
import { ImageRenderer } from './ImageRenderer'
import { AudioRenderer } from './AudioRenderer'
import { VideoRenderer } from './VideoRenderer'
import { VoiceRenderer } from './VoiceRenderer'

interface Props {
  part: Part
  /** If this part is a nested shell, call this to open it */
  onOpenShell?: (encoded: string) => void
}

export function PartRenderer({ part, onOpenShell }: Props) {
  switch (part.t) {
    case 'text':
      return <TextRenderer content={part.c} />

    case 'voice':
      return <VoiceRenderer content={part.c} voiceStyle={part.v} rate={part.r} pitch={part.p} label={part.l} />

    case 'url':
      return <UrlRenderer url={part.c} label={part.l} />

    case 'image':
      return <ImageRenderer content={part.c} mime={part.m} label={part.l} />

    case 'audio':
      return <AudioRenderer content={part.c} mime={part.m} label={part.l ?? part.n} />

    case 'video':
      return <VideoRenderer content={part.c} mime={part.m} label={part.l ?? part.n} />

    case 'shell':
      return (
        <button
          onClick={() => onOpenShell?.(part.c)}
          className="flex items-center gap-3 w-full px-4 py-3 bg-[#13121a] border border-[#7c3aed]/40 rounded-xl hover:border-[#7c3aed] transition-all cursor-pointer group"
        >
          <span className="text-2xl">{[...part.c][0]}</span>
          <div className="flex-1 text-left">
            <div className="text-sm text-white font-medium">Nested shell</div>
            <div className="text-xs text-[#6b6479]">Click to open</div>
          </div>
          <span className="text-[#6b6479] group-hover:text-white transition-colors">→</span>
        </button>
      )

    default:
      return <TextRenderer content={part.c} />
  }
}
