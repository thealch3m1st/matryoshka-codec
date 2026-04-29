import assert from 'node:assert/strict'
import test from 'node:test'
import { decodeRaw, decodeShell } from '../src/encoding.ts'
import { getEmbed } from '../src/embeds.ts'
import {
  buildPartyInviteFixture,
  partyInviteShells,
  PARTY_INVITE_LOCATION_URL,
  PARTY_INVITE_SUNO_ID,
  PARTY_INVITE_SUNO_URL,
} from './fixtures/partyInvite.ts'

test('party invite fixture opens as invite, music, cheers, location, RSVP', () => {
  const encodedShells = buildPartyInviteFixture()

  for (const [index, expected] of partyInviteShells.entries()) {
    const decoded = decodeShell(encodedShells[index])
    assert.equal(decoded?.carrier, [...expected.carrier][0])

    for (const part of expected.parts) {
      assert.deepEqual(decoded?.payload.parts.find(candidate => candidate.c === part.c), part)
    }

    const nested = decoded?.payload.parts.find(part => part.t === 'shell')
    assert.equal(nested?.c, encodedShells[index + 1])
  }
})

test('party invite keeps paulgb-style next-emoji raw decode at every outer shell', () => {
  const encodedShells = buildPartyInviteFixture()

  for (let i = 0; i < encodedShells.length - 1; i++) {
    assert.equal(decodeRaw(encodedShells[i])?.payload.startsWith(encodedShells[i + 1]), true)
  }
})

test('party invite embeds music while ordinary links stay generic', () => {
  assert.equal(getEmbed(PARTY_INVITE_SUNO_URL).src, `https://suno.com/embed/${PARTY_INVITE_SUNO_ID}`)
  assert.deepEqual(getEmbed(PARTY_INVITE_LOCATION_URL), {
    type: 'none',
    src: PARTY_INVITE_LOCATION_URL,
  })
})
