import { useEffect, useState } from "react";

export function BuildVersion() {
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [timeAgo, setTimeAgo] = useState<string>("");

  // Fetch build timestamp from the generated version.txt
  useEffect(() => {
    fetch("/new-synapse/version.txt", { cache: "no-store" })
      .then((res) => res.text())
      .then((text) => {
        const match = text.match(/BUILD_VERSION=(\d+)/);
        if (match) {
          setTimestamp(Number(match[1]));
        }
      })
      .catch(() => setTimestamp(null));
  }, []);

  // Convert timestamp → “x minutes ago”, update every 60 s
  useEffect(() => {
    if (!timestamp) return;

    const updateTimeAgo = () => {
      const seconds = Math.floor(Date.now() / 1000 - timestamp);
      if (seconds < 60) setTimeAgo(`${seconds}s ago`);
      else if (seconds < 3600) setTimeAgo(`${Math.floor(seconds / 60)} m ago`);
      else if (seconds < 86400) setTimeAgo(`${Math.floor(seconds / 3600)} h ago`);
      else setTimeAgo(`${Math.floor(seconds / 86400)} d ago`);
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000);
    return () => clearInterval(interval);
  }, [timestamp]);

  if (!timestamp) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "10px",
        right: "12px",
        fontSize: "0.7rem",
        color: "#ccc",
        background: "rgba(0,0,0,0.6)",
        borderRadius: "6px",
        padding: "4px 8px",
        fontFamily: "monospace",
        zIndex: 9999,
        opacity: 0.85,
      }}
    >
      Build #{timestamp} ({timeAgo})
    </div>
  );
}
