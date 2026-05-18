"use client";

import { useEffect, useState } from "react";
import { participantes } from "@/data/mock";
import { guardarUsuarioActivo, obtenerUsuarioActivo } from "@/lib/user";

export default function SelectorUsuario() {
  const [usuarioActivo, setUsuarioActivo] = useState(1);

  useEffect(() => {
    setUsuarioActivo(obtenerUsuarioActivo());
  }, []);

  function cambiarUsuario(id: number) {
    setUsuarioActivo(id);
    guardarUsuarioActivo(id);
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: "999px",
        padding: "7px 12px",
      }}
    >
      <span
        style={{
          width: "30px",
          height: "30px",
          borderRadius: "999px",
          background: "#2563eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "15px",
        }}
      >
        👤
      </span>

      <select
        value={usuarioActivo}
        onChange={(e) => cambiarUsuario(Number(e.target.value))}
        style={{
          background: "transparent",
          color: "white",
          border: "none",
          outline: "none",
          fontWeight: 800,
          fontSize: "15px",
          cursor: "pointer",
        }}
      >
        {participantes.map((participante) => (
          <option
            key={participante.id}
            value={participante.id}
            style={{
              background: "#111827",
              color: "white",
            }}
          >
            {participante.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}