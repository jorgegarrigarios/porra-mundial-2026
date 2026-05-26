import { obtenerPartidosPorLigaTemporada } from "@/lib/api/football";

type FixtureApiFootball = {
  fixture?: {
    id?: number;
    date?: string;
    status?: {
      short?: string;
      long?: string;
    };
  };
  league?: {
    id?: number;
    name?: string;
    season?: number;
    round?: string;
  };
  teams?: {
    home?: {
      id?: number;
      name?: string;
    };
    away?: {
      id?: number;
      name?: string;
    };
  };
  goals?: {
    home?: number | null;
    away?: number | null;
  };
};

export default async function TestApiPage() {
  try {
    const data = await obtenerPartidosPorLigaTemporada(1, 2026);

    const partidos: FixtureApiFootball[] = Array.isArray(data?.response)
      ? data.response
      : [];

    return (
      <main style={{ padding: "40px", color: "white", background: "#020617" }}>
        <h1>World Cup 2026 Fixtures</h1>

        <p>API get: {data?.get ?? "Sin get"}</p>
        <p>Partidos encontrados: {partidos.length}</p>

        {data?.errors && Object.keys(data.errors).length > 0 && (
          <>
            <h2>Errores API</h2>
            <pre>{JSON.stringify(data.errors, null, 2)}</pre>
          </>
        )}

        <h2>Primeros 5 fixtures</h2>
        <pre>{JSON.stringify(partidos.slice(0, 5), null, 2)}</pre>

        <h2>Respuesta completa resumida</h2>
        <pre>
          {JSON.stringify(
            {
              get: data?.get,
              parameters: data?.parameters,
              errors: data?.errors,
              results: data?.results,
              paging: data?.paging,
            },
            null,
            2
          )}
        </pre>
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
