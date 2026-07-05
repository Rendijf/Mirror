interface Props {
  onStartLive: () => void;
  onStartManual: () => void;
}

export function IntroScreen({ onStartLive, onStartManual }: Props) {
  return (
    <div className="intro">
      <h1>Mirror</h1>
      <p className="tagline">
        Not a photo of your face — a painting of your last two minutes.
      </p>
      <p className="intro-text">
        Mirror reads ~50 continuous facial micro-signals in real time and
        turns them into generative art that remembers your whole session.
        There are no emotion labels here: every twitch of an eyebrow feeds
        directly into color, motion, and shape.
      </p>
      <div className="intro-buttons">
        <button className="btn primary large" onClick={onStartLive}>
          Start with camera
        </button>
        <button className="btn large" onClick={onStartManual}>
          No camera? Manual mode
        </button>
      </div>
      <p className="privacy-note">
        Privacy by design: all face analysis runs in your browser. No video,
        image, or face data ever leaves your device.
      </p>
    </div>
  );
}
