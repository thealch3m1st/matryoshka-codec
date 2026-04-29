# Matryoshka Codec Tasks

## Current Scope

- Encode and decode nested emoji shells.
- Keep each outer shell compatible with raw variation-selector decoders by
  revealing the next encoded emoji first.
- Show byte and variation-selector counts before copying.
- Render current payload types: text, compact voice recipe, link, image, audio,
  video, and streaming embeds.

## Validation

```bash
npm test
npm run lint
npm run build
```

Local app:

```text
http://127.0.0.1:5173/matryoshka-codec/
```

Live test page:

```text
https://thealch3m1st.github.io/matryoshka-codec/
```
