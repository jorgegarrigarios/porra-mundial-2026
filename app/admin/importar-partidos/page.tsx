"use client";

import { useState } from "react";
import { Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type PartidoImportado = {
  local: string;
  visitante: string;
  local_code?: string;
  visitante_code?: string;
  fecha_inicio?: string;
  estadio?: string;
  ciudad?: string;
  fase?: string;
  grupo?: string;
  jornada?: number;
};

export default function ImportarPartidosPage() {
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState("");
  const [error, setError] = useState("");

  async function importarPartidos() {
    setResultado("");
    setError("");

    try {
      const partidos: PartidoImportado[] = JSON.parse(texto);

      if (!Array.isArray(partidos)) {
        setError("El JSON debe ser una lista de partidos.");
        return;
      }

      const partidosFormateados = partidos.map((p) => ({
        local: p.local,
        visitante: p.visitante,
        local_code: p.local_code ?? null,
        visitante_code: p.visitante_code ?? null,
        fecha_inicio: p.fecha_inicio ?? null,
        estadio: p.estadio ?? null,
        ciudad: p.ciudad ?? null,
        fase: p.fase ?? null,
        grupo: p.grupo ?? null,
        jornada: p.jornada ?? null,
      }));

      const { error: supabaseError } = await supabase
        .from("partidos")
        .upsert(partidosFormateados, {
          onConflict: "local,visitante,fecha_inicio",
          ignoreDuplicates: true,
        });

      if (supabaseError) {
        setError(supabaseError.message);
        return;
      }

      setResultado(
        `Importación completada. Procesados: ${partidos.length} partidos. Los duplicados se han ignorado.`
      );
      setTexto("");
    } catch {
      setError("JSON inválido. Revisa comas, comillas y corchetes.");
    }
  }

  return (
    <main className="page">
      <div className="container">
        <h1>Importar partidos</h1>

        <p className="subtitle">
          Pega un JSON con partidos completos. Si un partido ya existe, se
          ignorará automáticamente.
        </p>

        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={`[
  {
    "local": "España",
    "visitante": "Uruguay",
    "local_code": "es",
    "visitante_code": "uy",
    "fecha_inicio": "2026-06-14T21:00:00.000Z",
    "estadio": "MetLife Stadium",
    "ciudad": "New York/New Jersey",
    "fase": "Fase de grupos",
    "grupo": "Grupo H",
    "jornada": 1
  }
]`}
        />

        <button onClick={importarPartidos}>
          <Upload size={18} />
          Importar partidos
        </button>

        {resultado && (
          <div className="result success">
            <CheckCircle2 size={18} />
            {resultado}
          </div>
        )}

        {error && (
          <div className="result error">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}
      </div>

      <style>{`
        .page {
          min-height: 100vh;
          background: linear-gradient(180deg, #020617 0%, #111827 100%);
          color: white;
          padding: 40px 16px 120px;
        }

        .container {
          max-width: 1000px;
          margin: 0 auto;
        }

        h1 {
          font-size: 44px;
          font-weight: 900;
          margin: 0;
        }

        .subtitle {
          color: #94a3b8;
          margin-top: 8px;
          margin-bottom: 24px;
          line-height: 1.6;
        }

        textarea {
          width: 100%;
          min-height: 420px;
          box-sizing: border-box;
          border-radius: 18px;
          background: #020617;
          border: 1px solid rgba(255,255,255,0.14);
          color: #e5e7eb;
          padding: 18px;
          font-family: monospace;
          font-size: 14px;
          outline: none;
          resize: vertical;
        }

        button {
          margin-top: 18px;
          width: 100%;
          border: none;
          border-radius: 16px;
          background: #2563eb;
          color: white;
          font-weight: 900;
          padding: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
        }

        .result {
          margin-top: 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 18px;
          padding: 16px;
          font-weight: 900;
        }

        .success {
          background: rgba(22,163,74,0.16);
          border: 1px solid rgba(22,163,74,0.32);
          color: #86efac;
        }

        .error {
          background: rgba(239,68,68,0.16);
          border: 1px solid rgba(239,68,68,0.32);
          color: #fca5a5;
        }
      `}</style>
    </main>
  );
}