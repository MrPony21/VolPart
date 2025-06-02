import { useEffect, useRef } from "react";

export default function ScannerInput({ onScan }) {
  const bufferRef = useRef("");
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Si es TAB, procesar el buffer
      if (e.key === "Tab") {
        e.preventDefault(); // Evita cambiar de foco
        const code = bufferRef.current.trim();
        if (code !== "") {
          onScan(code);
        }
        bufferRef.current = ""; // Limpiar buffer después de escanear
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        return;
      }

      // Solo agregar caracteres imprimibles
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }

      // Solo limpiar el buffer si no llegó TAB, sin disparar onScan
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        bufferRef.current = ""; // Limpieza silenciosa
      }, 200);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onScan]);

  return null;
}
