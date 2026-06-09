import { obtenerPartidosPorLigaTemporada } from "@/lib/api/football";

type FixtureApiFootball = {
  fixture?: {
    id?: number;
    date?: string;
    status?: {
      short?: string;
      long?: string;
    };
    venue?: {
      name?: string | null;
      city?: string | null;
    };
  };
  league?: {
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

function formatearHoraEspana(fechaUtc?: string) {
  if (!fechaUtc) return "-";

  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(fechaUtc));
}

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

        <h2>Partidos API-FOOTBALL</h2>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "20px",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr>
                <th style={th}>Fixture ID</th>
                <th style={th}>Ronda</th>
                <th style={th}>Local</th>
                <th style={th}>Visitante</th>
                <th style={th}>Hora España</th>
                <th style={th}>Estado</th>
                <th style={th}>Estadio</th>
              </tr>
            </thead>
            <tbody>
              {partidos.map((partido) => (
                <tr key={partido.fixture?.id}>
                  <td style={td}>{partido.fixture?.id ?? "-"}</td>
                  <td style={td}>{partido.league?.round ?? "-"}</td>
                  <td style={td}>
                    {partido.teams?.home?.name ?? "-"}{" "}
                    <span style={{ opacity: 0.6 }}>
                      ({partido.teams?.home?.id ?? "-"})
                    </span>
                  </td>
                  <td style={td}>
                    {partido.teams?.away?.name ?? "-"}{" "}
                    <span style={{ opacity: 0.6 }}>
                      ({partido.teams?.away?.id ?? "-"})
                    </span>
                  </td>
                  <td style={td}>{formatearHoraEspana(partido.fixture?.date)}</td>
                  <td style={td}>
                    {partido.fixture?.status?.short ?? "-"} -{" "}
                    {partido.fixture?.status?.long ?? "-"}
                  </td>
                  <td style={td}>
                    {partido.fixture?.venue?.name ?? "-"}
                    {partido.fixture?.venue?.city
                      ? `, ${partido.fixture.venue.city}`
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

const th: React.CSSProperties = {
  borderBottom: "1px solid #334155",
  padding: "10px",
  textAlign: "left",
  color: "#cbd5e1",
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #1e293b",
  padding: "10px",
  verticalAlign: "top",
};