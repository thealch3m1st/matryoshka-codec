import { encodeShell } from './encoding.ts'
import { type Part } from './types.ts'

export const ROMANTIC_MIXTAPE_SUNO_ID = '10b00119-e257-4a01-81a8-e72eb744e106'
export const ROMANTIC_MIXTAPE_SUNO_URL = `https://suno.com/song/${ROMANTIC_MIXTAPE_SUNO_ID}`

export const ROMANTIC_MIXTAPE_SHELLS = [
  {
    name: 'opening note',
    carrier: '💌',
    parts: [{ t: 'text', c: 'This is for you' }],
  },
  {
    name: 'mixtape',
    carrier: '🎶',
    parts: [{ t: 'url', c: ROMANTIC_MIXTAPE_SUNO_URL }],
  },
  {
    name: 'tiny voice',
    carrier: '🌙',
    parts: [{ t: 'voice', c: 'miss you already', v: 'warm', l: 'late-night voice' }],
  },
  {
    name: 'final note',
    carrier: '💖',
    parts: [{ t: 'text', c: 'u' }],
  },
] satisfies Array<{ name: string; carrier: string; parts: Part[] }>

export function buildRomanticMixtapeExample(): string {
  return buildRomanticMixtapeEncodedShells()[0]
}

export function buildRomanticMixtapeEncodedShells(): string[] {
  const encodedShells = new Array<string>(ROMANTIC_MIXTAPE_SHELLS.length)

  for (let i = ROMANTIC_MIXTAPE_SHELLS.length - 1; i >= 0; i--) {
    const shell = ROMANTIC_MIXTAPE_SHELLS[i]
    const inner = encodedShells[i + 1]
    encodedShells[i] = encodeShell(shell.carrier, {
      v: 1,
      parts: inner ? [...shell.parts, { t: 'shell', c: inner }] : shell.parts,
    })
  }

  return encodedShells
}

export const ROMANTIC_MIXTAPE_EXAMPLE = buildRomanticMixtapeExample()
