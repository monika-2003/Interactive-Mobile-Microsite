/**
 * Screen 1: collect a name and up to 6 photos.
 * Generate stays off until both are filled, so the later screens always have something to show.
 */
import { useRef } from 'react';

const MAX_PHOTOS = 6;

function UploadScreen({
  photos,
  name,
  hasSaved,
  onPhotosChange,
  onNameChange,
  onGenerate,
  onOpenSaved,
}) {
  const fileInputRef = useRef(null);
  const slotsLeft = MAX_PHOTOS - photos.length;
  const canGenerate = photos.length > 0 && name.trim().length > 0;

  function openPicker() {
    if (slotsLeft === 0) return;
    fileInputRef.current?.click();
  }

  function handleFiles(event) {
    const files = Array.from(event.target.files || []).slice(0, slotsLeft);
    const added = files.map((file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      blob: file,
    }));
    onPhotosChange([...photos, ...added]);
    event.target.value = '';
  }

  function removePhoto(id) {
    const photo = photos.find((item) => item.id === id);
    if (photo) URL.revokeObjectURL(photo.url);
    onPhotosChange(photos.filter((item) => item.id !== id));
  }

  return (
    <section className="screen">
      <div className="upload-copy">
        <h1>Upload your favorite festive moments</h1>
        <p>Add up to 6 memories</p>
      </div>

      <div className="name-field">
        <label htmlFor="guest-name">Your name</label>
        <input
          id="guest-name"
          type="text"
          placeholder="Enter your name"
          value={name}
          maxLength={40}
          onChange={(event) => onNameChange(event.target.value)}
        />
      </div>

      <div className="slot-grid">
        {Array.from({ length: MAX_PHOTOS }, (_, index) => {
          const photo = photos[index];
          if (photo) {
            return (
              <button
                key={photo.id}
                type="button"
                className="slot"
                onClick={() => removePhoto(photo.id)}
                aria-label="Remove this photo"
              >
                <img src={photo.url} alt={`Memory ${index + 1}`} />
              </button>
            );
          }

          return (
            <button
              key={`empty-${index}`}
              type="button"
              className="slot"
              onClick={openPicker}
              aria-label="Upload a photo"
            >
              <span className="slot-plus">↑</span>
            </button>
          );
        })}
      </div>

      <p className="slot-count">{photos.length} / {MAX_PHOTOS} memories</p>

      <button
        type="button"
        className="generate-btn"
        disabled={!canGenerate}
        onClick={onGenerate}
      >
        Generate
      </button>

      {hasSaved && (
        <button type="button" className="open-portal-btn" onClick={onOpenSaved}>
          Open my portal
        </button>
      )}

      <input
        ref={fileInputRef}
        className="hidden-input"
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
      />
    </section>
  );
}

export default UploadScreen;
