export default function PrivacidadPage() {
  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <h1 style={styles.title}>Política de Privacidad</h1>

        <p style={styles.text}>
          Esta aplicación recopila y almacena datos necesarios para la creación
          de cuentas, gestión de pronósticos y funcionamiento de rankings.
        </p>

        <h2 style={styles.subtitle}>Datos recopilados</h2>

        <ul style={styles.list}>
          <li>Nombre y apellidos</li>
          <li>Nickname</li>
          <li>Correo electrónico</li>
          <li>Pronósticos y puntuaciones</li>
        </ul>

        <h2 style={styles.subtitle}>Finalidad</h2>

        <p style={styles.text}>
          Los datos se utilizan exclusivamente para el funcionamiento de la
          plataforma y experiencia de usuario.
        </p>

        <h2 style={styles.subtitle}>Almacenamiento</h2>

        <p style={styles.text}>
          Los datos se almacenan de forma segura mediante servicios cloud y no
          serán vendidos a terceros.
        </p>

        <h2 style={styles.subtitle}>Derechos</h2>

        <p style={styles.text}>
          El usuario podrá solicitar modificación o eliminación de sus datos
          contactando con el administrador de la plataforma.
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

  list: {
    color: "#cbd5e1",
    paddingLeft: "22px",
    lineHeight: 1.8,
  },
};