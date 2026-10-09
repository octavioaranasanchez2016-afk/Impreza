"use client";

import { useState } from "react";

// Campo trampa para robots: las personas no lo ven ni lo llenan (está fuera de la
// pantalla y el teclado lo salta); los robots que llenan todos los campos sí. Si llega
// lleno, el servidor descarta el envío (lib/bot.ts).
export function useHoneypot() {
  const [hp, setHp] = useState("");
  const honeypot = (
    <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
      <label>
        No escribas aquí
        <input
          type="text"
          name="impreza_hp"
          tabIndex={-1}
          autoComplete="off"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
        />
      </label>
    </div>
  );
  return { hp, honeypot };
}
