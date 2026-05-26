export function normalizarTexto(valor: string): string {
  return valor
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function crearSlug(valor: string): string {
  return normalizarTexto(valor)
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
