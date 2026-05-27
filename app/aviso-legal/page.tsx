export default function AvisoLegalPage() {
  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <p style={styles.eyebrow}>Información legal</p>
        <h1 style={styles.title}>Aviso Legal</h1>

        <p style={styles.updated}>Última actualización: 27 de mayo de 2026</p>

        <section style={styles.noticeBox}>
          <p style={styles.noticeText}>
            Porra Mundial 2026 es una plataforma privada de entretenimiento para
            crear ligas cerradas entre familiares, amigos y compañeros. No es
            una casa de apuestas, no organiza juegos de azar, no custodia dinero
            y no garantiza premios.
          </p>
        </section>

        <h2 style={styles.subtitle}>1. Titular de la plataforma</h2>

        <p style={styles.text}>
          El presente sitio web, accesible desde el dominio
          <strong> porrafutbol.futbol</strong>, es gestionado por el responsable
          del proyecto Porra Mundial 2026.
        </p>

        <p style={styles.text}>
          Para cualquier consulta relacionada con la plataforma, incidencias de
          uso, ejercicio de derechos o cuestiones legales, el usuario puede
          contactar a través del correo electrónico:
          <strong> soporte@porrafutbol.futbol</strong>.
        </p>

        <p style={styles.warningText}>
          Nota: si el proyecto pasa a tener uso comercial, acceso público
          generalizado, publicidad, monetización, gestión directa de pagos o una
          entidad jurídica titular, este apartado deberá actualizarse con los
          datos identificativos completos exigibles.
        </p>

        <h2 style={styles.subtitle}>2. Objeto de la plataforma</h2>

        <p style={styles.text}>
          Porra Mundial 2026 ofrece una herramienta digital para que usuarios
          autorizados puedan participar en ligas privadas de pronósticos
          deportivos relacionados con el Mundial de fútbol, consultar
          clasificaciones, realizar pronósticos y gestionar rankings dentro de
          grupos cerrados.
        </p>

        <p style={styles.text}>
          La plataforma tiene una finalidad exclusivamente recreativa, social y
          de entretenimiento privado. Su uso está pensado para grupos cerrados de
          familiares, amigos, compañeros de trabajo o círculos equivalentes.
        </p>

        <h2 style={styles.subtitle}>3. Naturaleza no lucrativa y no vinculada al juego</h2>

        <p style={styles.text}>
          La plataforma no tiene por objeto la explotación, organización,
          intermediación, comercialización ni promoción de apuestas, juegos de
          azar, rifas, concursos con premio económico o actividades sujetas a
          autorización administrativa en materia de juego.
        </p>

        <p style={styles.text}>
          Porra Mundial 2026 no actúa como operador de juego, no acepta apuestas,
          no fija cuotas, no procesa pagos, no custodia cantidades económicas,
          no retiene fondos de los usuarios y no garantiza la entrega de premios.
        </p>

        <p style={styles.text}>
          Cualquier acuerdo económico, bote, aportación o premio que pudiera
          existir entre participantes de una liga será, en su caso, un acuerdo
          privado, externo e independiente entre dichos usuarios, ajeno a la
          plataforma y bajo su exclusiva responsabilidad.
        </p>

        <h2 style={styles.subtitle}>4. Acceso y uso del sitio</h2>

        <p style={styles.text}>
          El acceso a determinadas funcionalidades requiere registro, inicio de
          sesión y pertenencia a una liga privada. El usuario se compromete a
          utilizar la plataforma de forma correcta, lícita, respetuosa y conforme
          a estas condiciones y a la normativa aplicable.
        </p>

        <p style={styles.text}>
          Queda prohibido utilizar la plataforma para fines fraudulentos,
          comerciales no autorizados, ilícitos, abusivos, contrarios a la buena
          fe o que puedan perjudicar a otros usuarios, al servicio o a terceros.
        </p>

        <h2 style={styles.subtitle}>5. Propiedad intelectual e industrial</h2>

        <p style={styles.text}>
          El diseño, estructura, textos, funcionalidades, código propio,
          interfaces, elementos visuales y contenidos originales de la plataforma
          están protegidos por la normativa aplicable en materia de propiedad
          intelectual e industrial.
        </p>

        <p style={styles.text}>
          Las referencias al Mundial, selecciones, competiciones, banderas,
          nombres de países, calendarios o eventos deportivos se utilizan con
          finalidad informativa, descriptiva y de entretenimiento. Porra Mundial
          2026 no está afiliada, patrocinada ni avalada por FIFA, federaciones,
          organizadores oficiales, selecciones nacionales ni terceros titulares
          de marcas, salvo que se indique expresamente lo contrario.
        </p>

        <h2 style={styles.subtitle}>6. Enlaces externos y servicios de terceros</h2>

        <p style={styles.text}>
          La plataforma puede apoyarse en servicios técnicos de terceros para su
          funcionamiento, como servicios de autenticación, base de datos,
          alojamiento, infraestructura cloud o proveedores de información
          técnica. El uso de dichos servicios se limitará a lo necesario para la
          prestación y seguridad del servicio.
        </p>

        <p style={styles.text}>
          En caso de incluir enlaces a sitios externos, Porra Mundial 2026 no se
          responsabiliza del contenido, disponibilidad, políticas o prácticas de
          dichos sitios de terceros.
        </p>

        <h2 style={styles.subtitle}>7. Disponibilidad y limitación de responsabilidad</h2>

        <p style={styles.text}>
          Aunque se procurará mantener la plataforma disponible y en correcto
          funcionamiento, no se garantiza la disponibilidad permanente, ausencia
          absoluta de errores, continuidad del servicio, exactitud completa de
          resultados deportivos o ausencia de interrupciones técnicas.
        </p>

        <p style={styles.text}>
          Porra Mundial 2026 no será responsable de daños derivados de caídas del
          servicio, errores técnicos, fallos de conexión, uso indebido por parte
          de los usuarios, pérdida de acceso, datos introducidos incorrectamente
          por los usuarios o acuerdos privados celebrados entre participantes.
        </p>

        <h2 style={styles.subtitle}>8. Protección de datos</h2>

        <p style={styles.text}>
          El tratamiento de los datos personales de los usuarios se regula en la
          Política de Privacidad de la plataforma, disponible en la sección
          correspondiente.
        </p>

        <h2 style={styles.subtitle}>9. Legislación aplicable y jurisdicción</h2>

        <p style={styles.text}>
          El presente Aviso Legal se regirá por la legislación española. Para
          cualquier controversia relacionada con la plataforma, las partes se
          someterán a los juzgados y tribunales que resulten competentes conforme
          a la normativa aplicable.
        </p>
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, rgba(37,99,235,0.16), transparent 34%), #020617",
    color: "white",
    padding: "46px 20px 120px",
  },

  container: {
    maxWidth: "920px",
    margin: "0 auto",
  },

  eyebrow: {
    color: "#60a5fa",
    fontSize: "13px",
    fontWeight: 950,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    margin: "0 0 10px",
  },

  title: {
    fontSize: "clamp(38px, 7vw, 58px)",
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: "-0.055em",
    margin: "0 0 14px",
  },

  updated: {
    color: "#94a3b8",
    fontSize: "14px",
    margin: "0 0 26px",
    fontWeight: 750,
  },

  noticeBox: {
    border: "1px solid rgba(96,165,250,0.30)",
    background:
      "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(15,23,42,0.82))",
    borderRadius: "24px",
    padding: "20px",
    marginBottom: "34px",
  },

  noticeText: {
    color: "#dbeafe",
    lineHeight: 1.75,
    fontSize: "17px",
    fontWeight: 800,
    margin: 0,
  },

  subtitle: {
    fontSize: "clamp(24px, 4vw, 32px)",
    lineHeight: 1.12,
    fontWeight: 950,
    letterSpacing: "-0.035em",
    marginTop: "38px",
    marginBottom: "12px",
  },

  text: {
    color: "#cbd5e1",
    lineHeight: 1.85,
    fontSize: "17px",
    margin: "0 0 16px",
  },

  warningText: {
    color: "#fde68a",
    background: "rgba(250,204,21,0.10)",
    border: "1px solid rgba(250,204,21,0.22)",
    borderRadius: "18px",
    padding: "14px",
    lineHeight: 1.65,
    fontSize: "15px",
    fontWeight: 750,
    margin: "10px 0 18px",
  },
};
