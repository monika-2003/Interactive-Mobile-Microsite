/**
 * Screens 2 + 3 live together because they are one timed sequence:
 * photos swirl out of the vortex, then a flash of light hands off to the portal.
 */
import { useEffect, useState } from 'react';

const SWIRL_MS = 3200;
const FLASH_MS = 1100;

function VortexScreen({ photos, onComplete }) {
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    const flashTimer = setTimeout(() => setShowFlash(true), SWIRL_MS);
    const doneTimer = setTimeout(onComplete, SWIRL_MS + FLASH_MS);
    return () => {
      clearTimeout(flashTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <section className="screen vortex-screen">
      <div className="vortex-stage">
        {photos.map((photo, index) => {
          const angle = (index / photos.length) * Math.PI * 2;
          const drift = `${Math.sin(angle) * 118}px`;
          const midX = `${Math.sin(angle + 0.9) * 42}px`;
          const rise = `${-280 - (index % 3) * 28}px`;
          const spin = `${index % 2 === 0 ? 200 : -180}deg`;

          return (
            <img
              key={photo.id}
              className="vortex-photo"
              src={photo.url}
              alt=""
              style={{
                '--drift': drift,
                '--mid-x': midX,
                '--rise': rise,
                '--spin': spin,
                animationDelay: `${index * 0.1}s`,
              }}
            />
          );
        })}
        <div className="vortex-ring" aria-hidden="true" />
      </div>

      <p className="vortex-caption">Transforming your memories…</p>

      <div className={`flash${showFlash ? ' is-on' : ''}`} aria-hidden="true" />
    </section>
  );
}

export default VortexScreen;
