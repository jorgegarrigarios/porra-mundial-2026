export default function TerminosPage() {
  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.title}>Términos y Condiciones</h1>

        <p style={styles.text}>
          El uso de esta plataforma implica la aceptación de las presentes
          condiciones.
        </p>

        <h2 style={styles.subtitle}>Uso permitido</h2>

        <p style={styles.text}>
          La plataforma está destinada exclusivamente a entretenimiento y
          participación en pronósticos deportivos.
        </p>

        <h2 style={styles.subtitle}>Responsabilidades</h2>

        <p style={styles.text}>
          El usuario es responsable de la veracidad de la información aportada y
          del uso adecuado de la plataforma.
        </p>

        <h2 style={styles.subtitle}>Disponibilidad</h2>

        <p style={styles.text}>
          La plataforma puede sufrir interrupciones, mantenimientos o cambios en
          cualquier momento.
        </p>

        <h2 style={styles.subtitle}>Cancelación de cuentas</h2>

        <p style={styles.text}>
          El administrador podrá suspender cuentas en caso de uso fraudulento o
          incumplimiento de las normas.
        </p>
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    background: "#020617",
    color: "white",
    padding: "40px 20px",
  },

  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },

  title: {
    fontSize: "48px",
    fontWeight: 900,
    marginBottom: "24px",
  },

  subtitle: {
    fontSize: "28px",
    fontWeight: 900,
    marginTop: "36px",
    marginBottom: "12px",
  },

  text: {
    color: "#cbd5e1",
    lineHeight: 1.8,
    fontSize: "17px",
  },
};