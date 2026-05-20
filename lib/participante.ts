import { supabase } from "@/lib/supabase";

export type ParticipanteActual = {
  id: number;
  nombre: string | null;
  apellidos?: string | null;
  nickname?: string | null;
  role?: string | null;
  acepta_privacidad?: boolean | null;
  acepta_terminos?: boolean | null;
};

type ParticipanteRow = {
  id: number;
  nombre: string | null;
  apellidos: string | null;
  nickname: string | null;
  role: string | null;
  acepta_privacidad: boolean | null;
  acepta_terminos: boolean | null;
};

type SupabaseResponse<T> = {
  data: T | null;
  error: {
    message: string;
  } | null;
};

function limpiarTexto(valor: string | null | undefined) {
  const limpio = valor?.trim();
  return limpio && limpio.length > 0 ? limpio : null;
}

function crearNombreDesdeEmail(email: string | null | undefined) {
  const nombre = email?.split("@")[0]?.trim();
  return nombre && nombre.length > 0 ? nombre : "Usuario";
}

function normalizarParticipante(
  participante: ParticipanteRow
): ParticipanteActual {
  return {
    id: participante.id,
    nombre: participante.nombre,
    apellidos: participante.apellidos,
    nickname: participante.nickname,
    role: participante.role,
    acepta_privacidad: participante.acepta_privacidad,
    acepta_terminos: participante.acepta_terminos,
  };
}

async function conTimeout<T>(
  operacion: PromiseLike<T>,
  ms: number,
  mensaje = "La operación ha tardado demasiado."
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(mensaje));
    }, ms);
  });

  try {
    return await Promise.race([Promise.resolve(operacion), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function obtenerParticipanteActual(): Promise<ParticipanteActual | null> {
  try {
    const userResponse = await conTimeout(
      supabase.auth.getUser(),
      8000,
      "Timeout obteniendo usuario autenticado."
    );

    const user = userResponse.data.user;

    if (userResponse.error || !user) {
      if (userResponse.error) {
        console.error(
          "Error obteniendo usuario autenticado:",
          userResponse.error.message
        );
      }

      return null;
    }

    const nombreMetadata = limpiarTexto(
      typeof user.user_metadata?.nombre === "string"
        ? user.user_metadata.nombre
        : null
    );

    const apellidosMetadata = limpiarTexto(
      typeof user.user_metadata?.apellidos === "string"
        ? user.user_metadata.apellidos
        : null
    );

    const nicknameMetadata = limpiarTexto(
      typeof user.user_metadata?.nickname === "string"
        ? user.user_metadata.nickname
        : null
    );

    const nombreFallback =
      nombreMetadata || crearNombreDesdeEmail(user.email);

    const nicknameFallback = nicknameMetadata || nombreFallback;

    const participanteResponse = (await conTimeout(
      supabase
        .from("participantes")
        .select(
          "id, nombre, apellidos, nickname, role, acepta_privacidad, acepta_terminos"
        )
        .eq("auth_user_id", user.id)
        .maybeSingle(),
      8000,
      "Timeout buscando participante por auth_user_id."
    )) as SupabaseResponse<ParticipanteRow>;

    if (participanteResponse.error) {
      console.error(
        "Error buscando participante por auth_user_id:",
        participanteResponse.error.message
      );

      return null;
    }

    if (participanteResponse.data) {
      const participanteExistente = participanteResponse.data;

      const necesitaActualizar =
        !participanteExistente.nombre ||
        !participanteExistente.nickname ||
        !participanteExistente.role ||
        participanteExistente.acepta_privacidad !== true ||
        participanteExistente.acepta_terminos !== true;

      if (!necesitaActualizar) {
        return normalizarParticipante(participanteExistente);
      }

      const participanteActualizadoResponse = (await conTimeout(
        supabase
          .from("participantes")
          .update({
            nombre: participanteExistente.nombre || nombreFallback,
            apellidos:
              participanteExistente.apellidos || apellidosMetadata || null,
            nickname: participanteExistente.nickname || nicknameFallback,
            role: participanteExistente.role || "user",
            acepta_privacidad: true,
            acepta_terminos: true,
          })
          .eq("auth_user_id", user.id)
          .select(
            "id, nombre, apellidos, nickname, role, acepta_privacidad, acepta_terminos"
          )
          .single(),
        8000,
        "Timeout actualizando participante existente."
      )) as SupabaseResponse<ParticipanteRow>;

      if (participanteActualizadoResponse.error) {
        console.error(
          "Error actualizando participante existente:",
          participanteActualizadoResponse.error.message
        );

        return normalizarParticipante(participanteExistente);
      }

      if (!participanteActualizadoResponse.data) {
        return normalizarParticipante(participanteExistente);
      }

      return normalizarParticipante(participanteActualizadoResponse.data);
    }

    const nuevoParticipante = {
      nombre: nombreFallback,
      apellidos: apellidosMetadata || null,
      nickname: nicknameFallback,
      auth_user_id: user.id,
      role: "user",
      acepta_privacidad: true,
      acepta_terminos: true,
    };

    const participanteCreadoResponse = (await conTimeout(
      supabase
        .from("participantes")
        .insert(nuevoParticipante)
        .select(
          "id, nombre, apellidos, nickname, role, acepta_privacidad, acepta_terminos"
        )
        .single(),
      8000,
      "Timeout creando participante automáticamente."
    )) as SupabaseResponse<ParticipanteRow>;

    if (participanteCreadoResponse.error) {
      console.error(
        "Error creando participante automáticamente:",
        participanteCreadoResponse.error.message
      );

      return null;
    }

    if (!participanteCreadoResponse.data) {
      console.error("No se recibió participante creado.");
      return null;
    }

    return normalizarParticipante(participanteCreadoResponse.data);
  } catch (error) {
    console.error("Error inesperado en obtenerParticipanteActual:", error);

    return null;
  }
}

export function obtenerNombreVisibleParticipante(
  participante: ParticipanteActual | null,
  email?: string | null
) {
  return (
    participante?.nickname?.trim() ||
    participante?.nombre?.trim() ||
    email?.trim() ||
    "Usuario"
  );
}