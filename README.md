# Festive Memory Portal

A mobile microsite from a 4-screen festive storyboard: upload up to 6 photos and a name, watch them swirl into a vortex, then find them again in a memory portal.

React 19 + Vite. Motion is CSS, not a 3D library. Saved memories stay on this phone in IndexedDB for 7 days.

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

I treated the storyboard as a sequence, not four separate pages.

`App.jsx` is the only place that owns the journey:

- `photos` and `name` (collected on screen 1, reused on 2 and 4)
- `step`: `upload` → `vortex` → `portal`
- `savedMemories` / `showList` for return visits

Screens stay presentational. They receive data and call back (`onGenerate`, `onComplete`, `onPickMemory`, `onMovePhoto`, `onDeleteMemory`, `onRestart`). They never write to IndexedDB themselves.

Persistence lives in `memoryStore.js`. Blob URLs die on refresh, so each photo keeps a `blob` in memory and the store saves that File/Blob. One record per name, 7-day expiry on load. Generating again with the same name replaces that person's photos.

```
src/
  App.jsx                      ← state + which screen is showing
  memoryStore.js               ← IndexedDB: save / load / delete / positions
  App.css                      ← festive look + all motion
  components/UploadScreen.jsx  ← name + 6 slots
  components/VortexScreen.jsx  ← swirl, then flash
  components/PortalScreen.jsx  ← name list, or floating photos
```

**Why only three UI components?** The flash is the last second of the vortex, not a page. Splitting it would add a remount without making the flow easier to follow.

**Why this stays extensible**

- A new screen is a new `step` value and a new component. `App` already switches on `step`.
- A new action (share, download) is a new callback from the screen that owns that UI.
- Storage can change (different expiry, a server later) without rewriting screens, because the store is a separate module.
- Named portals are already a list, not one overwrite-only record, so another person on the same phone is just another entry.

I did not add Redux or a router. This is one linear campaign flow. Extra layers would hide a sequence that is easier to explain as `step`.

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

## How I approached the 3D work (task 01)

I do not have a prior Three.js background. For task 01 I used **React Three Fiber** so the viewer could stay a React component instead of a raw WebGL script.

**What I figured out myself** (the part I would defend in an interview):

- Products are a catalog array. The viewer never names "helmet" or "duck". A new campaign product is a new config entry.
- Related UI state lives in one reducer (selected product, loading, live draft). The shareable URL `?product=` stays outside the reducer so that function stays plain and unit-testable.
- `React.memo` around the canvas and `React.lazy` for the three.js bundle, so editor typing and the loading overlay do not rebuild WebGL.

**Where I leaned on AI and docs:**

- Unfamiliar APIs: `useGLTF`, OrbitControls, cloning materials so a colour change does not mutate the cached GLTF scene
- Fitting models in view with `Box3`, after detached clones reported an empty bounding box and the model looked huge. That bug I had to understand; pasting a snippet did not fix the framing

I used AI the same way I do at work: fast on APIs I have not memorised, slow on architecture. The catalog, reducer, URL, and memo boundary were the actual design.

## Deploy and cache in production

`vite build` emits a static site. I would host `dist/` on Cloudflare Pages, Netlify, or S3 + CloudFront.

Hashed files under `/assets/` get `Cache-Control: public, max-age=31536000, immutable`. `index.html` stays short-cache or no-cache so a new deploy is picked up. User photos never leave the device (IndexedDB), so there is no photo CDN in this design. For a real campaign I would compress uploads before save, self-host the Google fonts, and put a long cache on the hashed JS/CSS only.
