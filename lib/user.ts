export function guardarUsuarioActivo(usuarioId: number) {
  localStorage.setItem(
    "usuarioActivo",
    usuarioId.toString()
  );
}

export function obtenerUsuarioActivo() {
  const usuario = localStorage.getItem("usuarioActivo");

  if (!usuario) {
    return 1;
  }

  return Number(usuario);
}