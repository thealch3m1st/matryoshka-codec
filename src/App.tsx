import { useState } from 'react'
import { Encoder } from './components/Encoder'
import { Decoder } from './components/Decoder'
import './index.css'

type Mode = 'encode' | 'decode'

export default function App() {
  const [mode, setMode] = useState<Mode>('encode')

  return (
    <div className="min-h-screen bg-[#0f0f13] text-[#e2e0ea] flex flex-col items-center px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">🪆</div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Matryoshka Codec</h1>
        <p className="text-[#9d99aa] mt-2 text-sm max-w-sm mx-auto">
          Hide messages inside emojis, nested like Russian dolls. Each layer conceals another.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex bg-[#1c1b24] rounded-xl p-1 mb-8 gap-1">
        {(['encode', 'decode'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              mode === m
                ? 'bg-[#7c3aed] text-white shadow'
                : 'text-[#9d99aa] hover:text-white'
            }`}
          >
            {m === 'encode' ? '✦ Encode' : '◎ Decode'}
          </button>
        ))}
      </div>

      {/* Main panel */}
      <div className="w-full" style={{ maxWidth: '42rem' }}>
        {mode === 'encode' ? <Encoder /> : <Decoder />}
      </div>

      <footer className="mt-16 text-[#4b4859] text-xs">
        Hidden text uses Unicode{' '}
        <a
          href="https://unicode.org/charts/nameslist/n_E0100.html"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-[#9d99aa]"
        >
          variation selectors
        </a>
        {' '}— invisible to readers, nestable forever.{' '}
        <a
          href="https://thealch3m1st.github.io/matryoshka-codec/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-[#9d99aa]"
        >
          Live page
        </a>
        {' '}·{' '}
        <a
          href="https://github.com/thealch3m1st/matryoshka-codec"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-[#9d99aa]"
        >
          Source on GitHub
        </a>
      </footer>
    </div>
  )
}
