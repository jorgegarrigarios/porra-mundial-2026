import { supabase } from "./supabase";

export type AdminCheckResult = {
  isAdmin: boolean;
  participanteId: number | null;
  role: string | null;
};

export async function comprobarAdminActual(): Promise<AdminCheckResult> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return {
      isAdmin: false,
      participanteId: null,
      role: null,
    };
  }

  const { data: participante, error: participanteError } = await supabase
    .from("participantes")
    .select("id, role")
    .eq("auth_user_id", session.user.id)
    .maybeSingle();

  if (participanteError || !participante) {
    return {
      isAdmin: false,
      participanteId: null,
      role: null,
    };
  }

  return {
    isAdmin: participante.role === "admin",
    participanteId: participante.id,
    role: participante.role,
  };
}

export async function esAdminActual(): Promise<boolean> {
  const resultado = await comprobarAdminActual();
  return resultado.isAdmin;
}