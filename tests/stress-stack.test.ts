import assert from 'node:assert/strict'
import test from 'node:test'
import { decodeRaw, decodeShell } from '../src/encoding.ts'
import { getEmbed } from '../src/embeds.ts'
import {
  buildStressStackFixture,
  stressStackShells,
  STRESS_BIG_TEXT,
  STRESS_UNKNOWN_SUNO_URL,
} from './fixtures/stressStack.ts'

test('stress stack opens every layer without losing large text or binary-ish parts', () => {
  const encodedShells = buildStressStackFixture()

  for (const [index, expected] of stressStackShells.entries()) {
    const decoded = decodeShell(encodedShells[index])
    assert.equal(decoded?.carrier, [...expected.carrier][0])

    for (const part of expected.parts) {
      assert.deepEqual(decoded?.payload.parts.find(candidate => candidate.c === part.c), part)
    }

    const nested = decoded?.payload.parts.find(part => part.t === 'shell')
    assert.equal(nested?.c, encodedShells[index + 1])
  }
})

test('stress stack keeps paulgb-style next-emoji raw decode through the deep chain', () => {
  const encodedShells = buildStressStackFixture()

  for (let i = 0; i < encodedShells.length - 1; i++) {
    assert.equal(decodeRaw(encodedShells[i])?.payload.startsWith(encodedShells[i + 1]), true)
  }
})

test('stress stack is actually chunky and unknown embeds stay safe', () => {
  const encodedShells = buildStressStackFixture()

  assert.equal(STRESS_BIG_TEXT.length > 5000, true)
  assert.equal(encodedShells[0].length > 5000, true)
  assert.deepEqual(getEmbed(STRESS_UNKNOWN_SUNO_URL), {
    type: 'suno',
    src: '',
    href: STRESS_UNKNOWN_SUNO_URL,
    id: undefined,
    needsResolve: true,
  })
})
