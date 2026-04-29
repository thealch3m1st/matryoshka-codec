# Matryoshka Codec Test Plan

## Automated Checks

```bash
npm test
npm run lint
npm run build
```

These cover codec round trips, nested shell compatibility, legacy payload
inference, payload size formatting, and streaming embed routing.

## Browser Smoke Test

Use:

```text
http://127.0.0.1:5173/matryoshka-codec/
```

1. Encode a text shell, copy it, and decode it.
2. Encode a nested shell stack, then decode it shell by shell.
3. Decode the romantic mixtape fixture from the example card.
4. Confirm chapter mode opens content immediately.
5. Confirm one-shot mode reveals the selected shell contents at once.
6. Confirm the layer trail can jump between shells.
7. Confirm image, audio, video, and supported streaming links render or show a
   usable fallback link.

Live test page:

```text
https://thealch3m1st.github.io/matryoshka-codec/
```
