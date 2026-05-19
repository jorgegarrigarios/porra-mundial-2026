import { supabase } from "@/lib/supabase";

export type ParticipanteActual = {
  id: number;
  nombre: string | null;
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

    const { data: participanteExistente, error: participanteError } =
      await supabase
        .from("participantes")
        .select("id, nombre, apellidos, nickname, role")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (participanteError) {
      console.error(
        "Error obteniendo participante:",
        participanteError.message
      );

      return null;
    }

    if (participanteExistente) {
      return participanteExistente;
    }

    const email =
      user.email?.split("@")[0]?.trim() || "Usuario";

    const nuevoParticipante = {
      nombre: email,
      apellidos: null,
      nickname: email,
      auth_user_id: user.id,
      acepta_privacidad: true,
      acepta_terminos: true,
      role: "user",
    };

    const { data: participanteCreado, error: createError } =
      await supabase
        .from("participantes")
        .insert(nuevoParticipante)
        .select("id, nombre, apellidos, nickname, role")
        .single();

    if (createError) {
      console.error(
        "Error creando participante automáticamente:",
        createError.message
      );

      return null;
    }

    return participanteCreado;
  } catch (error) {
    console.error(
      "Error inesperado en obtenerParticipanteActual:",
      error
    );

    return null;
  }
}