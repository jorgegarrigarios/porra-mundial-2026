import { supabase } from "@/lib/supabase";

export type ParticipanteActual = {
  id: number;
  nombre: string;
  apellidos?: string | null;
  nickname?: string | null;
  role?: string | null;
};

export async function obtenerParticipanteActual(): Promise<ParticipanteActual | null> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    const { data, error } = await supabase
      .from("participantes")
      .select("id, nombre, apellidos, nickname, role")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error obteniendo participante:", error.message);
      return null;
    }

    return data ?? null;
  } catch (error) {
    console.error("Error inesperado en obtenerParticipanteActual:", error);
    return null;
  }
}