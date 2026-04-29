import assert from 'node:assert/strict'
import test from 'node:test'
import { decodeRaw, decodeShell, encodeRaw, encodeShell, formatBytes, scanSpans } from '../src/encoding.ts'
import { type Part, type ShellPayload } from '../src/types.ts'

test('raw variation-selector codec round trips UTF-8 payloads', () => {
  const encoded = encodeRaw('💌', 'hello 🌙')
  assert.equal([...encoded][0], '💌')
  assert.deepEqual(decodeRaw(encoded), { carrier: '💌', payload: 'hello 🌙' })
})

test('raw codec preserves multi-codepoint carriers like flags and ZWJ emoji', () => {
  assert.deepEqual(decodeRaw(encodeRaw('🇺🇸', 'flag shell')), {
    carrier: '🇺🇸',
    payload: 'flag shell',
  })
  assert.deepEqual(decodeRaw(encodeRaw('👩‍💻', 'code shell')), {
    carrier: '👩‍💻',
    payload: 'code shell',
  })
})

test('leaf shell round trips multimodal parts', () => {
  const parts: Part[] = [
    { t: 'text', c: 'plain note' },
    { t: 'voice', c: 'meet me inside the tiny emoji', v: 'warm' },
    { t: 'url', c: 'https://suno.com/s/BbMKt9iy1tWBN1Rz' },
    { t: 'image', c: 'iVBORw0KGgo=', m: 'image/png', n: 'pixel.png' },
    { t: 'audio', c: 'AAAA', m: 'audio/mp4', n: 'voice.m4a' },
    { t: 'video', c: 'BBBB', m: 'video/mp4', n: 'clip.mp4' },
  ]
  const payload: ShellPayload = { v: 1, parts }
  const decoded = decodeShell(encodeShell('✨', payload))
  assert.equal(decoded?.carrier, '✨')
  assert.deepEqual(decoded?.payload, payload)
})

test('nested shell keeps paulgb-style raw compatibility at non-leaf layers', () => {
  const inner = encodeShell('💫', { v: 1, parts: [{ t: 'voice', c: 'secret chorus', v: 'bright' }] })
  const outer = encodeShell('💌', {
    v: 1,
    parts: [
      { t: 'text', c: 'outer note' },
      { t: 'url', c: 'https://suno.com/song/10b00119-e257-4a01-81a8-e72eb744e106' },
      { t: 'shell', c: inner },
    ],
  })

  const rawOuter = decodeRaw(outer)
  assert.equal(rawOuter?.payload.startsWith('💫'), true)

  const decodedOuter = decodeShell(outer)
  assert.equal(decodedOuter?.carrier, '💌')
  assert.equal(decodedOuter?.payload.parts.length, 3)
  assert.equal(decodedOuter?.payload.parts[0].t, 'shell')
  assert.equal(decodedOuter?.payload.parts[1].t, 'text')
  assert.equal(decodedOuter?.payload.parts[2].t, 'url')

  const decodedInner = decodeShell(decodedOuter?.payload.parts[0].c ?? '')
  assert.equal(decodedInner?.carrier, '💫')
  assert.deepEqual(decodedInner?.payload.parts[0], { t: 'voice', c: 'secret chorus', v: 'bright' })
})

test('scanSpans splits text around embedded encoded shells', () => {
  const encoded = encodeRaw('🌙', 'inner')
  assert.deepEqual(scanSpans(`before ${encoded} after`), [
    { type: 'text', value: 'before ' },
    { type: 'encoded', value: encoded },
    { type: 'text', value: ' after' },
  ])
})

test('scanSpans keeps multi-codepoint shell carriers intact', () => {
  const encoded = encodeRaw('🇺🇸', 'inner')
  assert.deepEqual(scanSpans(`before ${encoded} after`), [
    { type: 'text', value: 'before ' },
    { type: 'encoded', value: encoded },
    { type: 'text', value: ' after' },
  ])
})

test('legacy fallback infers URLs, text, and data URLs', () => {
  assert.deepEqual(decodeShell(encodeRaw('🔗', 'https://example.com'))?.payload.parts, [
    { t: 'url', c: 'https://example.com' },
  ])
  assert.deepEqual(decodeShell(encodeRaw('✦', 'just words'))?.payload.parts, [
    { t: 'text', c: 'just words' },
  ])
  assert.deepEqual(decodeShell(encodeRaw('🖼️', 'data:image/png;base64,AAAA'))?.payload.parts, [
    { t: 'image', c: 'AAAA', m: 'image/png' },
  ])
})

test('formatBytes produces readable payload weight labels', () => {
  assert.equal(formatBytes(75), '75 B')
  assert.equal(formatBytes(2048), '2.0 KB')
  assert.equal(formatBytes(2 * 1024 * 1024), '2.00 MB')
})
