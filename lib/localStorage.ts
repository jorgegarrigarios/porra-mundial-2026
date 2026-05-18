export type PronosticoLocal = {
  local: string;
  visitante: string;
};

export function guardarPronosticos(data: Record<number, PronosticoLocal>) {
  localStorage.setItem("pronosticos", JSON.stringify(data));
}

export function obtenerPronosticos(): Record<number, PronosticoLocal> {
  const data = localStorage.getItem("pronosticos");

  if (!data) {
    return {};
  }

  return JSON.parse(data);
}