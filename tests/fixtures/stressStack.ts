import { encodeShell } from '../../src/encoding.ts'
import { type Part } from '../../src/types.ts'

export const STRESS_UNKNOWN_SUNO_URL = 'https://suno.com/s/not-yet-known'
export const STRESS_BIG_TEXT = [
  'This payload is intentionally chunky.',
  'It should still survive as invisible bytes inside one visible emoji.',
  'edge '.repeat(1200),
].join(' ')

export const stressStackShells = [
  { name: 'start', carrier: '💌', parts: [{ t: 'text', c: 'stress-start' }] },
  { name: 'large text', carrier: '🌊', parts: [{ t: 'text', c: STRESS_BIG_TEXT }] },
  { name: 'unknown short link', carrier: '🔗', parts: [{ t: 'url', c: STRESS_UNKNOWN_SUNO_URL }] },
  { name: 'voice recipe', carrier: '🎙️', parts: [{ t: 'voice', c: 'tiny voice survives the deep stack', v: 'bright' }] },
  { name: 'image', carrier: '🖼️', parts: [{ t: 'image', c: 'iVBORw0KGgo=', m: 'image/png', n: 'pixel.png' }] },
  { name: 'final', carrier: '💖', parts: [{ t: 'text', c: 'stress-end' }] },
] satisfies Array<{ name: string; carrier: string; parts: Part[] }>

export function buildStressStackFixture(): string[] {
  const encodedShells = new Array<string>(stressStackShells.length)

  for (let i = stressStackShells.length - 1; i >= 0; i--) {
    const shell = stressStackShells[i]
    const inner = encodedShells[i + 1]
    encodedShells[i] = encodeShell(shell.carrier, {
      v: 1,
      parts: inner ? [...shell.parts, { t: 'shell', c: inner }] : shell.parts,
    })
  }

  return encodedShells
}
