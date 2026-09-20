/**
 * App is the only place that knows "where we are" in the journey.
 * Screens stay simple: they receive data and call back when the user is done.
 */
import { useCallback, useEffect, useState } from 'react';
import UploadScreen from './components/UploadScreen.jsx';
import VortexScreen from './components/VortexScreen.jsx';
import PortalScreen from './components/PortalScreen.jsx';
import { loadMemories, saveMemory, savePhotoPositions, deleteMemory } from './memoryStore.js';
import './App.css';

function FairyLights() {
  return (
    <div className="fairy-lights" aria-hidden="true">
      {Array.from({ length: 15 }, (_, i) => (
        <span
          key={i}
          className="fairy-bulb"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  );
}

function photosFromSaved(savedPhotos) {
  return savedPhotos.map((photo) => ({
    id: photo.id,
    blob: photo.blob,
    url: URL.createObjectURL(photo.blob),
    x: photo.x,
    y: photo.y,
  }));
}

function App() {
  const [photos, setPhotos] = useState([]);
  const [name, setName] = useState('');
  const [step, setStep] = useState('upload');
  const [savedMemories, setSavedMemories] = useState([]);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadMemories()
      .then((list) => {
        if (cancelled) return;
        setSavedMemories(list);
      })
      .catch((error) => {
        console.warn('Could not load memories', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleGenerate() {
    try {
      await saveMemory({ name, photos });
      const list = await loadMemories();
      setSavedMemories(list);
    } catch (error) {
      console.warn('Could not save memories', error);
    }
    setShowList(false);
    setStep('vortex');
  }

  function handleOpenSaved() {
    photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    setPhotos([]);
    setName('');
    setShowList(true);
    setStep('portal');
  }

  function handlePickMemory(memory) {
    photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    setName(memory.name);
    setPhotos(photosFromSaved(memory.photos));
    setShowList(false);
  }

  function handleMovePhoto(id, position) {
    setPhotos((current) =>
      current.map((photo) => (photo.id === id ? { ...photo, ...position } : photo))
    );
    savePhotoPositions(name, { [id]: position }).catch((error) => {
      console.warn('Could not save photo position', error);
    });
  }

  async function handleDeleteMemory(memoryName) {
    if (!window.confirm(`Delete ${memoryName}'s memory?`)) return;
    try {
      const list = await deleteMemory(memoryName);
      setSavedMemories(list);
      const viewing = name.trim().toLowerCase() === memoryName.trim().toLowerCase();
      if (viewing) {
        photos.forEach((photo) => URL.revokeObjectURL(photo.url));
        setPhotos([]);
        setName('');
        setShowList(list.length > 0);
      }
      if (list.length === 0) setStep('upload');
    } catch (error) {
      console.warn('Could not delete memory', error);
    }
  }

  // useCallback keeps the vortex timers from resetting if App re-renders
  const handleVortexDone = useCallback(() => {
    setShowList(false);
    setStep('portal');
  }, []);

  // Back to upload only. IndexedDB stays until they Generate a new set or 7 days pass.
  function handleRestart() {
    photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    setPhotos([]);
    setName('');
    setShowList(false);
    setStep('upload');
  }

  return (
    <div className="page">
      <div className="phone">
        <FairyLights />

        {step === 'upload' && (
          <UploadScreen
            photos={photos}
            name={name}
            hasSaved={savedMemories.length > 0}
            onPhotosChange={setPhotos}
            onNameChange={setName}
            onGenerate={handleGenerate}
            onOpenSaved={handleOpenSaved}
          />
        )}

        {step === 'vortex' && (
          <VortexScreen photos={photos} onComplete={handleVortexDone} />
        )}

        {step === 'portal' && (
          <PortalScreen
            photos={photos}
            name={name}
            savedMemories={savedMemories}
            showList={showList}
            onPickMemory={handlePickMemory}
            onMovePhoto={handleMovePhoto}
            onDeleteMemory={handleDeleteMemory}
            onRestart={handleRestart}
          />
        )}
      </div>
    </div>
  );
}

export default App;
