type VercelRequest = {
  method?: string
  query: {
    url?: string | string[]
  }
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  setHeader: (name: string, value: string) => void
  json: (body: unknown) => void
  end: () => void
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const rawUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url
  if (!rawUrl) {
    res.status(400).json({ error: 'Missing Suno URL' })
    return
  }

  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    res.status(400).json({ error: 'Invalid Suno URL' })
    return
  }

  if (!url.hostname.endsWith('suno.com')) {
    res.status(400).json({ error: 'Only suno.com URLs can be resolved' })
    return
  }

  const directMatch = url.pathname.match(/^\/song\/([\w-]+)/)
  if (directMatch) {
    res.status(200).json({
      id: directMatch[1],
      embedSrc: `https://suno.com/embed/${directMatch[1]}`,
    })
    return
  }

  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      accept: 'text/html',
      'user-agent': 'matryoshka-codec/1.0',
    },
  })

  const resolvedUrl = new URL(response.url)
  const songMatch = resolvedUrl.pathname.match(/^\/song\/([\w-]+)/)

  if (!songMatch) {
    res.status(404).json({
      error: 'Could not resolve Suno short link',
      hint: 'Use the full suno.com/song/... URL if this link is private or expired.',
    })
    return
  }

  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
  res.status(200).json({
    id: songMatch[1],
    embedSrc: `https://suno.com/embed/${songMatch[1]}`,
    resolvedUrl: resolvedUrl.toString(),
  })
}
