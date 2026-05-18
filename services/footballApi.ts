import { partidos } from "@/data/mock";

export async function getPartidos() {
  // De momento usamos datos mock.
  // Más adelante aquí conectaremos API-Football o football-data.org.
  return partidos;
}