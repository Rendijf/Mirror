import { useState } from "react";
import { IntroScreen } from "./components/IntroScreen";
import { LiveView } from "./components/LiveView";
import { ManualMode } from "./components/ManualMode";
import { Gallery } from "./components/Gallery";
import { loadGallery, saveToGallery, deleteFromGallery } from "./gallery/storage";
import type { Renderer } from "./engine/renderer";
import type { GalleryItem } from "./types";

type Mode = "intro" | "live" | "manual";

export default function App() {
  const [mode, setMode] = useState<Mode>("intro");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [gallery, setGallery] = useState<GalleryItem[]>(loadGallery);
  const [flash, setFlash] = useState(false);

  const handleCapture = (renderer: Renderer) => {
    setGallery(saveToGallery(renderer.captureThumb(1024)));
    setFlash(true);
    setTimeout(() => setFlash(false), 350);
  };

  return (
    <div className="app">
      {mode === "intro" && (
        <IntroScreen
          onStartLive={() => setMode("live")}
          onStartManual={() => setMode("manual")}
        />
      )}
      {mode === "live" && (
        <LiveView
          onCapture={handleCapture}
          onSwitchToManual={() => setMode("manual")}
        />
      )}
      {mode === "manual" && (
        <ManualMode
          onCapture={handleCapture}
          onSwitchToLive={() => setMode("live")}
        />
      )}

      {mode !== "intro" && (
        <div className="top-bar">
          <button className="btn subtle" onClick={() => setMode("intro")}>
            Mirror
          </button>
          <button className="btn subtle" onClick={() => setGalleryOpen(true)}>
            Gallery ({gallery.length})
          </button>
        </div>
      )}

      {galleryOpen && (
        <Gallery
          items={gallery}
          onDelete={(id) => setGallery(deleteFromGallery(id))}
          onClose={() => setGalleryOpen(false)}
        />
      )}

      {flash && <div className="capture-flash" />}
    </div>
  );
}
