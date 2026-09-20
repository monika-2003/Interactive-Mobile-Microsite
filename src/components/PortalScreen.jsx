/**
 * Screen 4: festive space with floating photos.
 * Drag a photo to move it. Tap (without dragging) to look closer.
 */
import { useEffect, useRef, useState } from 'react';

const LAYOUTS = {
  1: [{ x: 22, y: 24, w: 56, h: 38, tilt: '-3deg', delay: '0s' }],
  2: [
    { x: 8, y: 24, w: 38, h: 34, tilt: '-8deg', delay: '0s' },
    { x: 54, y: 34, w: 38, h: 34, tilt: '8deg', delay: '0.4s' },
  ],
  3: [
    { x: 6, y: 22, w: 38, h: 30, tilt: '-7deg', delay: '0s' },
    { x: 56, y: 22, w: 38, h: 30, tilt: '9deg', delay: '0.4s' },
    { x: 28, y: 52, w: 42, h: 24, tilt: '3deg', delay: '0.8s' },
  ],
  4: [
    { x: 6, y: 22, w: 40, h: 28, tilt: '-8deg', delay: '0s' },
    { x: 54, y: 22, w: 40, h: 28, tilt: '8deg', delay: '0.4s' },
    { x: 6, y: 52, w: 40, h: 26, tilt: '6deg', delay: '0.8s' },
    { x: 54, y: 52, w: 40, h: 26, tilt: '-10deg', delay: '0.2s' },
  ],
  5: [
    { x: 6, y: 20, w: 32, h: 26, tilt: '-8deg', delay: '0s' },
    { x: 62, y: 20, w: 32, h: 26, tilt: '10deg', delay: '0.4s' },
    { x: 34, y: 36, w: 32, h: 24, tilt: '-4deg', delay: '0.6s' },
    { x: 8, y: 54, w: 36, h: 24, tilt: '6deg', delay: '0.8s' },
    { x: 56, y: 54, w: 36, h: 24, tilt: '-12deg', delay: '0.2s' },
  ],
  6: [
    { x: 6, y: 20, w: 28, h: 24, tilt: '-8deg', delay: '0s' },
    { x: 66, y: 20, w: 28, h: 24, tilt: '10deg', delay: '0.4s' },
    { x: 6, y: 40, w: 28, h: 22, tilt: '6deg', delay: '0.8s' },
    { x: 66, y: 40, w: 28, h: 22, tilt: '-12deg', delay: '0.2s' },
    { x: 20, y: 56, w: 28, h: 22, tilt: '4deg', delay: '1s' },
    { x: 36, y: 22, w: 28, h: 24, tilt: '-4deg', delay: '0.6s' },
  ],
};

function layoutFor(photos) {
  const base = LAYOUTS[photos.length] || LAYOUTS[6];
  return photos.map((photo, index) => {
    const fallback = base[index] || base[0];
    return {
      ...fallback,
      x: photo.x ?? fallback.x,
      y: photo.y ?? fallback.y,
    };
  });
}

const SPARKLES = [
  { top: '28%', left: '48%' },
  { top: '36%', left: '70%' },
  { top: '52%', left: '32%' },
  { top: '68%', left: '58%' },
  { top: '24%', left: '22%' },
  { top: '74%', left: '18%' },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function PortalScreen({
  photos,
  name,
  savedMemories,
  showList,
  onPickMemory,
  onMovePhoto,
  onDeleteMemory,
  onRestart,
}) {
  const stageRef = useRef(null);
  const dragRef = useRef(null);
  const [spots, setSpots] = useState(() => layoutFor(photos));
  const [draggingId, setDraggingId] = useState(null);
  const [openId, setOpenId] = useState(null);
  const openPhoto = photos.find((photo) => photo.id === openId);
  const photoIds = photos.map((photo) => photo.id).join(',');

  useEffect(() => {
    setSpots(layoutFor(photos));
  }, [photoIds]);

  function pointerPercent(event) {
    const box = stageRef.current.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * 100,
      y: ((event.clientY - box.top) / box.height) * 100,
    };
  }

  function onPointerDown(event, index) {
    event.preventDefault();
    stageRef.current?.setPointerCapture(event.pointerId);
    const point = pointerPercent(event);
    const spot = spots[index];
    dragRef.current = {
      index,
      moved: false,
      startX: point.x,
      startY: point.y,
      originX: spot.x,
      originY: spot.y,
    };
    setDraggingId(photos[index].id);
  }

  function onPointerMove(event) {
    const drag = dragRef.current;
    if (!drag) return;

    const point = pointerPercent(event);
    const dx = point.x - drag.startX;
    const dy = point.y - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 0.8) drag.moved = true;

    const spot = spots[drag.index];
    const x = clamp(drag.originX + dx, 0, 100 - spot.w);
    const y = clamp(drag.originY + dy, 14, 82 - spot.h);
    drag.latest = { x, y };

    setSpots((current) =>
      current.map((item, index) => (index === drag.index ? { ...item, x, y } : item))
    );
  }

  function onPointerUp() {
    const drag = dragRef.current;
    if (!drag) return;

    if (!drag.moved) {
      setOpenId(photos[drag.index].id);
    } else if (drag.latest && onMovePhoto) {
      onMovePhoto(photos[drag.index].id, drag.latest);
    }

    dragRef.current = null;
    setDraggingId(null);
  }

  if (showList) {
    return (
      <section className="screen portal-screen">
        <div className="lanterns" aria-hidden="true">
          <span className="lantern" />
          <span className="lantern" />
          <span className="lantern" />
        </div>

        {SPARKLES.map((sparkle, index) => (
          <span
            key={index}
            className="sparkle"
            style={{ ...sparkle, animationDelay: `${index * 0.3}s` }}
          />
        ))}

        <h2 className="portal-greeting">Memory portals</h2>
        <p className="portal-sub">Tap a name to open those memories</p>

        <div className="memory-list">
          {savedMemories.map((memory) => (
            <div key={memory.name} className="memory-row">
              <button
                type="button"
                className="memory-name-btn"
                onClick={() => onPickMemory(memory)}
              >
                {`${memory.name}'s memory`}
              </button>
              <button
                type="button"
                className="memory-delete-btn"
                onClick={() => onDeleteMemory(memory.name)}
                aria-label={`Delete ${memory.name}'s memory`}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="rangoli" aria-hidden="true" />

        <button type="button" className="restart-btn" onClick={onRestart}>
          Start over
        </button>
      </section>
    );
  }

  return (
    <section
      ref={stageRef}
      className="screen portal-screen"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="lanterns" aria-hidden="true">
        <span className="lantern" />
        <span className="lantern" />
        <span className="lantern" />
      </div>

      {SPARKLES.map((sparkle, index) => (
        <span
          key={index}
          className="sparkle"
          style={{ ...sparkle, animationDelay: `${index * 0.3}s` }}
        />
      ))}

      <h2 className="portal-greeting">{`${name.trim()}'s memories`}</h2>
      <p className="portal-sub">Drag to move · tap to look closer</p>

      {photos.map((photo, index) => {
        const spot = spots[index];
        if (!spot) return null;
        return (
          <div
            key={photo.id}
            className={`portal-photo${draggingId === photo.id ? ' is-dragging' : ''}`}
            style={{
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              width: `${spot.w}%`,
              height: `${spot.h}%`,
              '--tilt': spot.tilt,
              animationDelay: spot.delay,
              zIndex: draggingId === photo.id ? 6 : 2,
            }}
            onPointerDown={(event) => onPointerDown(event, index)}
          >
            <img src={photo.url} alt="" draggable="false" />
          </div>
        );
      })}

      <div className="rangoli" aria-hidden="true" />

      <button type="button" className="restart-btn" onClick={onRestart}>
        Start over
      </button>

      {openPhoto && (
        <button
          type="button"
          className="lightbox"
          onClick={() => setOpenId(null)}
          aria-label="Close photo"
        >
          <img src={openPhoto.url} alt="Selected memory" />
        </button>
      )}
    </section>
  );
}

export default PortalScreen;
