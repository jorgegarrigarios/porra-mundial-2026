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

function normalizarParticipante(participante: ParticipanteRow): ParticipanteActual {
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

async function conTimeoutSuave<T>(
  operacion: PromiseLike<T>,
  ms: number
): Promise<T | null> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeout = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => resolve(null), ms);
  });

  try {
    return await Promise.race([Promise.resolve(operacion), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function obtenerParticipanteActual(): Promise<ParticipanteActual | null> {
  try {
    const sessionResponse = await conTimeoutSuave(
      supabase.auth.getSession(),
      5000
    );

    let user = sessionResponse?.data.session?.user ?? null;

    if (!user) {
      const userResponse = await conTimeoutSuave(
        supabase.auth.getUser(),
        7000
      );

      user = userResponse?.data.user ?? null;

      if (userResponse?.error) {
        console.warn(
          "No se pudo validar usuario autenticado:",
          userResponse.error.message
        );
      }
    }

    if (!user) {
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

    const nombreFallback = nombreMetadata || crearNombreDesdeEmail(user.email);
    const nicknameFallback = nicknameMetadata || nombreFallback;

    const participanteResponse = (await conTimeoutSuave(
      supabase
        .from("participantes")
        .select(
          "id, nombre, apellidos, nickname, role, acepta_privacidad, acepta_terminos"
        )
        .eq("auth_user_id", user.id)
        .maybeSingle(),
      8000
    )) as SupabaseResponse<ParticipanteRow> | null;

    if (!participanteResponse) {
      console.warn("Timeout buscando participante por auth_user_id.");
      return null;
    }

    if (participanteResponse.error) {
      console.warn(
        "Error buscando participante por auth_user_id:",
        participanteResponse.error.message
      );
      return null;
    }

    if (participanteResponse.data) {
      const participanteExistente = participanteResponse.data;
      const roleNormalizado =
        participanteExistente.role === "admin" ? "admin" : "user";

      const necesitaActualizar =
        !participanteExistente.nombre ||
        !participanteExistente.nickname ||
        participanteExistente.role !== roleNormalizado ||
        participanteExistente.acepta_privacidad !== true ||
        participanteExistente.acepta_terminos !== true;

      if (!necesitaActualizar) {
        return normalizarParticipante(participanteExistente);
      }

      const participanteActualizadoResponse = (await conTimeoutSuave(
        supabase
          .from("participantes")
          .update({
            nombre: participanteExistente.nombre || nombreFallback,
            apellidos:
              participanteExistente.apellidos || apellidosMetadata || null,
            nickname: participanteExistente.nickname || nicknameFallback,
            role: roleNormalizado,
            acepta_privacidad: true,
            acepta_terminos: true,
          })
          .eq("auth_user_id", user.id)
          .select(
            "id, nombre, apellidos, nickname, role, acepta_privacidad, acepta_terminos"
          )
          .single(),
        8000
      )) as SupabaseResponse<ParticipanteRow> | null;

      if (
        participanteActualizadoResponse?.data &&
        !participanteActualizadoResponse.error
      ) {
        return normalizarParticipante(participanteActualizadoResponse.data);
      }

      return normalizarParticipante(participanteExistente);
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

    const participanteCreadoResponse = (await conTimeoutSuave(
      supabase
        .from("participantes")
        .insert(nuevoParticipante)
        .select(
          "id, nombre, apellidos, nickname, role, acepta_privacidad, acepta_terminos"
        )
        .single(),
      8000
    )) as SupabaseResponse<ParticipanteRow> | null;

    if (!participanteCreadoResponse) {
      console.warn("Timeout creando participante automáticamente.");
      return null;
    }

    if (participanteCreadoResponse.error) {
      const msg = participanteCreadoResponse.error.message || "";

      if (
        msg.includes("duplicate key") ||
        msg.includes("participantes_auth_user_id_key")
      ) {
        const retryResponse = (await conTimeoutSuave(
          supabase
            .from("participantes")
            .select(
              "id, nombre, apellidos, nickname, role, acepta_privacidad, acepta_terminos"
            )
            .eq("auth_user_id", user.id)
            .maybeSingle(),
          5000
        )) as SupabaseResponse<ParticipanteRow> | null;

        if (retryResponse?.data) {
          return normalizarParticipante(retryResponse.data);
        }
      }

      console.warn(
        "Error creando participante automáticamente:",
        participanteCreadoResponse.error.message
      );
      return null;
    }

    if (!participanteCreadoResponse.data) {
      return null;
    }

    return normalizarParticipante(participanteCreadoResponse.data);
  } catch (error) {
    console.warn("Error controlado en obtenerParticipanteActual:", error);
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