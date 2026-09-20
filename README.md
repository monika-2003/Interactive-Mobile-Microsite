# Festive Memory Portal

A mobile microsite from a 4-screen festive storyboard: upload up to 6 photos and a name, watch them swirl into a vortex, then find them again in a memory portal.

React 19 + Vite. Motion is CSS. Saved memories stay on this phone in IndexedDB for 7 days.

This is the same idea as a campaign landing page: one short, guided experience.

## Setup

Needs Node 18+ and npm.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build      # production bundle in dist/
npm run preview    # serve that bundle locally
```

On a laptop the app sits in a phone-sized frame. On a real phone it is full screen.

### How to try it

1. Type a name
2. Tap a dark slot and pick up to 6 photos
3. Tap **Generate**
4. Watch the swirl, then the flash
5. In the portal, drag a photo to move it, or tap it to look closer
6. **Start over** returns to upload. IndexedDB is not wiped
7. Refresh: **Open my portal** lists names like **Monika's memory**. Tap one to open it. **×** deletes that person's entry

## State management and component architecture

`App.jsx` owns all journey state: `photos`, `name`, `step` (`upload` → `vortex` → `portal`), and saved memories. Screens are presentational. They call back instead of writing IndexedDB themselves.

Persistence is isolated in `memoryStore.js` (one record per name, 7-day expiry). The flash lives in VortexScreen, not a fourth page.

A new screen is a new `step` + component. A new action is a new callback. Storage can change without rewriting UI. No Redux or router: this is one linear flow.

```
src/
  App.jsx                      ← state + which screen is showing
  memoryStore.js               ← IndexedDB
  components/UploadScreen.jsx
  components/VortexScreen.jsx  ← swirl, then flash
  components/PortalScreen.jsx
```

## React performance

The expensive work here is images and motion, not component count. I kept React out of the animation loop.

What I did:

1. **CSS transforms and opacity** for swirl, flash, and float, so those animations can stay on the compositor. I did not drive them with `requestAnimationFrame` inside React.
2. **Drag updates local `spots` in `PortalScreen`.** App (and IndexedDB) only get the new `x` / `y` on pointer up, so moving a photo does not re-render the whole tree every frame.
3. **`useCallback` on `handleVortexDone`**, so VortexScreen's timers are not reset if App re-renders mid-animation.
4. **Blob URLs are revoked** when a photo is removed or the user starts over.
5. **IndexedDB stores File/Blob objects**, not base64. That is both persistence and a size decision.

If I had more time I would measure, not guess:

- React Profiler on drag and on **Generate**, to confirm App stays quiet during pointer move
- Performance panel: swirl/float should be transform-only (no layout thrash)
- Time to save 6 full-resolution phone photos in IndexedDB, then decide whether to resize before write
- Lighthouse on a real device: LCP, main-thread long tasks, memory after a few generate → restart cycles

## Deploy and cache in production

`vite build` emits a static site. I would host `dist/` on Cloudflare Pages, Netlify, or S3 + CloudFront.

Hashed files under `/assets/` get `Cache-Control: public, max-age=31536000, immutable`. `index.html` stays short-cache or no-cache so a new deploy is picked up. User photos never leave the device (IndexedDB), so there is no photo CDN in this design. For a real campaign I would compress uploads before save, self-host the Google fonts, and put a long cache on the hashed JS/CSS only.
