import assert from 'node:assert/strict'
import test from 'node:test'
import { decodeRaw, decodeShell } from '../src/encoding.ts'
import { getEmbed } from '../src/embeds.ts'
import {
  buildRomanticMixtapeFixture,
  romanticMixtapeShells,
  ROMANTIC_MIXTAPE_SUNO_ID,
} from './fixtures/romanticMixtape.ts'

test('romantic mixtape fixture opens as text, Suno, Tiny Voice, final note', () => {
  const encodedShells = buildRomanticMixtapeFixture()

  for (const [index, expected] of romanticMixtapeShells.entries()) {
    const decoded = decodeShell(encodedShells[index])
    assert.equal(decoded?.carrier, expected.carrier)

    for (const part of expected.parts) {
      assert.deepEqual(decoded?.payload.parts.find(candidate => candidate.t === part.t), part)
    }

    const nested = decoded?.payload.parts.find(part => part.t === 'shell')
    assert.equal(nested?.c, encodedShells[index + 1])
  }
})

test('romantic mixtape keeps paulgb-style next-emoji raw decode at every outer shell', () => {
  const encodedShells = buildRomanticMixtapeFixture()

  for (let i = 0; i < encodedShells.length - 1; i++) {
    const raw = decodeRaw(encodedShells[i])
    assert.equal(raw?.payload.startsWith(encodedShells[i + 1]), true)
  }
})

test('romantic mixtape Suno shell resolves to playable embed URL', () => {
  const sunoShell = decodeShell(buildRomanticMixtapeFixture()[1])
  const url = sunoShell?.payload.parts.find(part => part.t === 'url')?.c

  assert.equal(getEmbed(url ?? '').src, `https://suno.com/embed/${ROMANTIC_MIXTAPE_SUNO_ID}`)
})
