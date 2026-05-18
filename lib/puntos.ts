export function calcularPuntos(
  pronosticoLocal: number,
  pronosticoVisitante: number,
  resultadoLocal: number,
  resultadoVisitante: number
) {
  // Marcador exacto
  if (
    pronosticoLocal === resultadoLocal &&
    pronosticoVisitante === resultadoVisitante
  ) {
    return 5;
  }

  // Ganador correcto o empate
  const pronosticoDif = pronosticoLocal - pronosticoVisitante;
  const resultadoDif = resultadoLocal - resultadoVisitante;

  if (
    (pronosticoDif > 0 && resultadoDif > 0) ||
    (pronosticoDif < 0 && resultadoDif < 0) ||
    (pronosticoDif === 0 && resultadoDif === 0)
  ) {
    return 3;
  }

  // Diferencia de goles correcta
  if (pronosticoDif === resultadoDif) {
    return 1;
  }

  return 0;
}