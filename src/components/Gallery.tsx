import type { GalleryItem } from "../types";

interface Props {
  items: GalleryItem[];
  onDelete: (id: string) => void;
  onClose: () => void;
}

function download(item: GalleryItem) {
  const a = document.createElement("a");
  a.href = item.thumb;
  a.download = `mirror-${new Date(item.createdAt).toISOString().slice(0, 19)}.jpg`;
  a.click();
}

/** Local-only gallery of captured session paintings. */
export function Gallery({ items, onDelete, onClose }: Props) {
  return (
    <div className="gallery-backdrop" onClick={onClose}>
      <div className="gallery" onClick={(e) => e.stopPropagation()}>
        <div className="gallery-header">
          <h2>Your paintings</h2>
          <button className="btn subtle" onClick={onClose}>
            Close
          </button>
        </div>
        {items.length === 0 ? (
          <p className="gallery-empty">
            Nothing here yet — capture a painting first. Everything is stored
            only in this browser.
          </p>
        ) : (
          <div className="gallery-grid">
            {items.map((item) => (
              <figure key={item.id} className="gallery-item">
                <img src={item.thumb} alt="Captured session painting" />
                <figcaption>
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                  <span className="gallery-actions">
                    <button className="btn subtle" onClick={() => download(item)}>
                      Save
                    </button>
                    <button className="btn subtle" onClick={() => onDelete(item.id)}>
                      Delete
                    </button>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
