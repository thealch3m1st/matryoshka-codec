import assert from 'node:assert/strict'
import test from 'node:test'
import { getEmbed } from '../src/embeds.ts'

const SUNO_SONG_ID = '10b00119-e257-4a01-81a8-e72eb744e106'
const SUNO_EMBED = `https://suno.com/embed/${SUNO_SONG_ID}`

test('Suno direct song URL embeds with the song UUID', () => {
  assert.deepEqual(getEmbed(`https://suno.com/song/${SUNO_SONG_ID}`), {
    type: 'suno',
    src: SUNO_EMBED,
    href: `https://suno.com/song/${SUNO_SONG_ID}`,
    id: SUNO_SONG_ID,
  })
})

test('Known Suno short link embeds with the resolved song UUID', () => {
  assert.deepEqual(getEmbed('https://suno.com/s/BbMKt9iy1tWBN1Rz'), {
    type: 'suno',
    src: SUNO_EMBED,
    href: 'https://suno.com/s/BbMKt9iy1tWBN1Rz',
    id: SUNO_SONG_ID,
    needsResolve: false,
  })
})

test('Unknown Suno short link asks the app resolver instead of iframing the share code', () => {
  assert.deepEqual(getEmbed('https://suno.com/s/not-yet-known'), {
    type: 'suno',
    src: '',
    href: 'https://suno.com/s/not-yet-known',
    id: undefined,
    needsResolve: true,
  })
})

test('Non-embed URLs stay generic links', () => {
  assert.deepEqual(getEmbed('https://example.com/hello'), {
    type: 'none',
    src: 'https://example.com/hello',
  })
})
