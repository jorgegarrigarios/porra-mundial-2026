import { obtenerPartidosPorLigaTemporada } from "@/lib/api/football";

export default async function TestApiPage() {
  try {
    const partidos = await obtenerPartidosPorLigaTemporada(1, 2026);

    return (
      <main style={{ padding: "40px", color: "white", background: "#020617" }}>
        <h1>World Cup 2026 Fixtures</h1>

        <p>Partidos encontrados: {partidos.length}</p>

        <pre>{JSON.stringify(partidos.slice(0, 5), null, 2)}</pre>
      </main>
    );
  } catch (error) {
    return (
      <main style={{ padding: "40px", color: "white", background: "#020617" }}>
        <h1>Error API</h1>

        <pre>{String(error)}</pre>
      </main>
    );
  }
}