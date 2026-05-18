import { calcularPuntos } from "./puntos";

type Participante = {
  id: number;
  nombre: string;
};

type Partido = {
  id: number;
  resultadoLocal: number | null;
  resultadoVisitante: number | null;
};

type Pronostico = {
  participanteId: number;
  partidoId: number;
  golesLocal: number;
  golesVisitante: number;
};

export function generarRanking(
  participantes: Participante[],
  partidos: Partido[],
  pronosticos: Pronostico[]
) {
  return participantes
    .map((participante) => {
      let puntos = 0;
      let exactos = 0;
      let acertados = 0;

      const pronosticosJugador = pronosticos.filter(
        (p) => p.participanteId === participante.id
      );

      pronosticosJugador.forEach((pronostico) => {
        const partido = partidos.find(
          (m) => m.id === pronostico.partidoId
        );

        if (
          !partido ||
          partido.resultadoLocal === null ||
          partido.resultadoVisitante === null
        ) {
          return;
        }

        const puntosPartido = calcularPuntos(
          pronostico.golesLocal,
          pronostico.golesVisitante,
          partido.resultadoLocal,
          partido.resultadoVisitante
        );

        puntos += puntosPartido;

        if (puntosPartido === 5) {
          exactos++;
        }

        if (puntosPartido >= 3) {
          acertados++;
        }
      });

      return {
        ...participante,
        puntos,
        exactos,
        acertados,
      };
    })
    .sort((a, b) => b.puntos - a.puntos);
}