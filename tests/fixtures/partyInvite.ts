import { encodeShell } from '../../src/encoding.ts'
import { type Part } from '../../src/types.ts'

export const PARTY_INVITE_SUNO_ID = '10b00119-e257-4a01-81a8-e72eb744e106'
export const PARTY_INVITE_SUNO_URL = `https://suno.com/song/${PARTY_INVITE_SUNO_ID}`
export const PARTY_INVITE_LOCATION_URL = 'https://maps.google.com/?q=37.7749,-122.4194'

export const partyInviteShells = [
  {
    name: 'invite',
    carrier: '💌',
    parts: [{ t: 'text', c: 'Friday at 8. Bring your sparkle.' }],
  },
  {
    name: 'music',
    carrier: '🎶',
    parts: [{ t: 'url', c: PARTY_INVITE_SUNO_URL }],
  },
  {
    name: 'cheers',
    carrier: '🥂',
    parts: [{ t: 'text', c: 'Cheers to you.' }],
  },
  {
    name: 'location',
    carrier: '📍',
    parts: [{ t: 'url', c: PARTY_INVITE_LOCATION_URL }],
  },
  {
    name: 'rsvp',
    carrier: '✨',
    parts: [{ t: 'text', c: 'RSVP yes if you are in.' }],
  },
] satisfies Array<{ name: string; carrier: string; parts: Part[] }>

export function buildPartyInviteFixture(): string[] {
  const encodedShells = new Array<string>(partyInviteShells.length)

  for (let i = partyInviteShells.length - 1; i >= 0; i--) {
    const shell = partyInviteShells[i]
    const inner = encodedShells[i + 1]
    encodedShells[i] = encodeShell(shell.carrier, {
      v: 1,
      parts: inner ? [...shell.parts, { t: 'shell', c: inner }] : shell.parts,
    })
  }

  return encodedShells
}
