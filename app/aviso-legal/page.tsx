export default function AvisoLegalPage() {
  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.title}>Aviso Legal</h1>

        <p style={styles.text}>
          Esta plataforma es un proyecto digital destinado a entretenimiento y
          participación en pronósticos deportivos.
        </p>

        <h2 style={styles.subtitle}>Titular</h2>

        <p style={styles.text}>
          El titular de la plataforma podrá identificarse mediante los canales
          oficiales de contacto facilitados dentro del servicio.
        </p>

        <h2 style={styles.subtitle}>Propiedad intelectual</h2>

        <p style={styles.text}>
          Los contenidos, diseño y funcionalidades de la plataforma están
          protegidos por la normativa aplicable de propiedad intelectual.
        </p>

        <h2 style={styles.subtitle}>Limitación de responsabilidad</h2>

        <p style={styles.text}>
          No se garantiza la disponibilidad continua ni la ausencia de errores
          técnicos.
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