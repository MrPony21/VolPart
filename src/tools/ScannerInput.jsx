import { useEffect } from "react";

export default function ScannerInput({ onScan }) {
  let buffer = "";
  let timeout = null;

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (timeout) clearTimeout(timeout);

      buffer += e.key;

      // Espera 200ms sin escribir para considerar que terminó el escaneo
      timeout = setTimeout(() => {
        if (buffer.trim() !== "") {
          onScan(buffer.trim());
          buffer = "";
        }
      }, 200);
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => {
      window.removeEventListener("keypress", handleKeyPress);
      if (timeout) clearTimeout(timeout);
    };
  }, [onScan]);

  return null;
}
