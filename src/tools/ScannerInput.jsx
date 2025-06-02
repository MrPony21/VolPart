import { useEffect, useRef } from "react";

export default function ScannerInput({ onScan }) {
  const bufferRef = useRef("");
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Evita escanear si estás escribiendo en un input
      if (document.activeElement && document.activeElement.tagName === "INPUT") {
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        const code = bufferRef.current.trim();
        if (code !== "") {
          onScan(code); // ← Aquí entra SOLO lo escaneado
        }
        bufferRef.current = "";
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        return;
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        bufferRef.current = "";
      }, 200); // si esperas más de 200ms entre teclas, se resetea
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onScan]);

  return null;
}
