import { useEffect, useState } from "react";

export function BuildVersion() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    fetch("/new-synapse/version.txt", { cache: "no-store" })
      .then((res) => res.text())
      .then((text) => {
        const match = text.match(/BUILD_VERSION=(\d+)/);
        if (match) {
          const date = new Date(Number(match[1]) * 1000);
          const formatted = date.toLocaleString();
          setVersion(formatted);
        }
      })
      .catch(() => setVersion(null));
  }, []);

  if (!version) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "10px",
        right: "12px",
        fontSize: "0.7rem",
        color: "#aaa",
        background: "rgba(0,0,0,0.6)",
        borderRadius: "6px",
        padding: "3px 6px",
        fontFamily: "monospace",
        zIndex: 9999,
      }}
    >
      v{version}
    </div>
  );
}
