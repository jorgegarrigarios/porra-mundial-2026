export default function PrivacidadPage() {
  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <p style={styles.eyebrow}>Protección de datos</p>
        <h1 style={styles.title}>Política de Privacidad</h1>

        <p style={styles.updated}>Última actualización: 27 de mayo de 2026</p>

        <section style={styles.noticeBox}>
          <p style={styles.noticeText}>
            Esta política explica cómo Porra Mundial 2026 trata los datos
            personales de los usuarios conforme al Reglamento General de
            Protección de Datos (RGPD), la Ley Orgánica 3/2018 de Protección de
            Datos Personales y garantía de los derechos digitales (LOPDGDD) y la
            normativa española aplicable.
          </p>
        </section>

        <h2 style={styles.subtitle}>1. Responsable del tratamiento</h2>

        <p style={styles.text}>
          El responsable del tratamiento de los datos personales es el
          responsable del proyecto Porra Mundial 2026, plataforma privada de
          entretenimiento accesible desde el dominio
          <strong> porrafutbol.futbol</strong>.
        </p>

        <p style={styles.text}>
          Correo de contacto para cuestiones relacionadas con privacidad,
          soporte o ejercicio de derechos:
          <strong> soporte@porrafutbol.futbol</strong>.
        </p>

        <p style={styles.warningText}>
          Nota: si la plataforma pasa a gestionarse mediante sociedad, autónomo,
          asociación u otra entidad jurídica, esta política deberá actualizarse
          incluyendo denominación social, NIF/CIF, domicilio y demás datos
          identificativos aplicables.
        </p>

        <h2 style={styles.subtitle}>2. Datos personales tratados</h2>

        <p style={styles.text}>
          La plataforma puede tratar las siguientes categorías de datos,
          dependiendo del uso realizado por cada usuario:
        </p>

        <ul style={styles.list}>
          <li>Nombre y apellidos facilitados durante el registro.</li>
          <li>Nickname o alias visible dentro de la plataforma.</li>
          <li>Correo electrónico.</li>
          <li>Identificador técnico de usuario asociado al sistema de autenticación.</li>
          <li>Datos de acceso y sesión necesarios para mantener la cuenta activa.</li>
          <li>Ligas en las que participa el usuario.</li>
          <li>Pronósticos, bonus, puntuaciones, rankings y resultados asociados.</li>
          <li>Estado informativo de participación en ligas, cuando sea necesario para la gestión interna de la liga.</li>
          <li>Comunicaciones enviadas al soporte.</li>
          <li>Datos técnicos mínimos necesarios para seguridad, funcionamiento y prevención de abuso.</li>
        </ul>

        <h2 style={styles.subtitle}>3. Finalidades del tratamiento</h2>

        <p style={styles.text}>Los datos se tratan para las siguientes finalidades:</p>

        <ul style={styles.list}>
          <li>Crear y gestionar cuentas de usuario.</li>
          <li>Permitir el inicio de sesión mediante email/contraseña o proveedores externos como Google.</li>
          <li>Gestionar ligas privadas, invitaciones y participación de usuarios.</li>
          <li>Guardar pronósticos, bonus, puntuaciones y rankings.</li>
          <li>Mostrar clasificaciones dentro de las ligas privadas.</li>
          <li>Atender consultas, incidencias y solicitudes de soporte.</li>
          <li>Prevenir usos abusivos, fraudulentos o contrarios a las condiciones de uso.</li>
          <li>Mantener la seguridad, disponibilidad y correcto funcionamiento de la plataforma.</li>
          <li>Cumplir obligaciones legales que pudieran resultar aplicables.</li>
        </ul>

        <h2 style={styles.subtitle}>4. Base jurídica del tratamiento</h2>

        <p style={styles.text}>
          Las bases jurídicas que legitiman el tratamiento de datos son:
        </p>

        <ul style={styles.list}>
          <li>
            <strong>Consentimiento del usuario</strong>, prestado al registrarse
            y aceptar la Política de Privacidad y los Términos y Condiciones.
          </li>
          <li>
            <strong>Ejecución de la relación de usuario</strong>, necesaria para
            crear la cuenta, permitir el acceso, guardar pronósticos y gestionar
            la participación en ligas.
          </li>
          <li>
            <strong>Interés legítimo</strong> en mantener la seguridad del
            servicio, prevenir abusos, resolver incidencias y conservar registros
            técnicos mínimos.
          </li>
          <li>
            <strong>Cumplimiento de obligaciones legales</strong>, cuando sea
            necesario atender requerimientos o responsabilidades legales.
          </li>
        </ul>

        <h2 style={styles.subtitle}>5. Ligas privadas y visibilidad de datos</h2>

        <p style={styles.text}>
          Porra Mundial 2026 funciona mediante ligas privadas. Los datos visibles
          dentro de una liga, como nickname, puntuación, ranking o pronósticos
          que formen parte de la dinámica de la competición, podrán ser vistos
          por otros participantes de esa misma liga.
        </p>

        <p style={styles.text}>
          La plataforma no está diseñada como red social abierta ni como sistema
          público de publicación masiva de datos personales. El acceso a ligas
          está limitado a usuarios autorizados o invitados.
        </p>

        <h2 style={styles.subtitle}>6. Conservación de los datos</h2>

        <p style={styles.text}>
          Los datos se conservarán mientras el usuario mantenga su cuenta activa
          y sean necesarios para el funcionamiento de la plataforma, la gestión
          de ligas, rankings y pronósticos.
        </p>

        <p style={styles.text}>
          Cuando un usuario solicite la supresión de su cuenta, sus datos serán
          eliminados o, cuando proceda, bloqueados durante los plazos necesarios
          para atender posibles responsabilidades legales, técnicas o de
          seguridad.
        </p>

        <h2 style={styles.subtitle}>7. Comunicación de datos a terceros</h2>

        <p style={styles.text}>
          No se venden datos personales a terceros ni se ceden para finalidades
          comerciales, publicitarias o de marketing.
        </p>

        <p style={styles.text}>
          Para prestar el servicio pueden intervenir proveedores tecnológicos
          necesarios, como servicios de autenticación, base de datos, hosting,
          infraestructura cloud o correo transaccional. Estos proveedores actúan
          como encargados del tratamiento o prestadores técnicos necesarios para
          el funcionamiento de la plataforma.
        </p>

        <p style={styles.text}>
          Entre los servicios técnicos utilizados o previstos pueden encontrarse
          proveedores como Supabase, Vercel u otros servicios equivalentes de
          infraestructura, autenticación, almacenamiento, despliegue o seguridad.
        </p>

        <h2 style={styles.subtitle}>8. Transferencias internacionales</h2>

        <p style={styles.text}>
          Algunos proveedores tecnológicos pueden operar con infraestructura o
          subencargados ubicados fuera del Espacio Económico Europeo. En tal
          caso, se procurará que dichas transferencias se realicen conforme a las
          garantías previstas por la normativa aplicable, como cláusulas
          contractuales tipo, decisiones de adecuación u otros mecanismos
          reconocidos por el RGPD.
        </p>

        <h2 style={styles.subtitle}>9. Cookies y tecnologías similares</h2>

        <p style={styles.text}>
          La plataforma utiliza únicamente cookies o tecnologías técnicas
          necesarias para permitir la autenticación, mantener la sesión,
          garantizar la seguridad y prestar el servicio solicitado por el
          usuario.
        </p>

        <p style={styles.text}>
          Actualmente no se utilizan cookies analíticas, publicitarias, de
          seguimiento comportamental ni herramientas de marketing que requieran
          consentimiento específico. Por este motivo, no se muestra un banner de
          aceptación de cookies.
        </p>

        <p style={styles.text}>
          Si en el futuro se incorporan herramientas de analítica, publicidad,
          medición avanzada o seguimiento no estrictamente necesario, se
          actualizará esta política y se solicitará el consentimiento cuando sea
          legalmente exigible.
        </p>

        <h2 style={styles.subtitle}>10. Derechos de los usuarios</h2>

        <p style={styles.text}>
          Los usuarios pueden ejercer, en los términos previstos por la normativa
          aplicable, los siguientes derechos:
        </p>

        <ul style={styles.list}>
          <li>Derecho de acceso a sus datos personales.</li>
          <li>Derecho de rectificación de datos inexactos.</li>
          <li>Derecho de supresión de los datos cuando proceda.</li>
          <li>Derecho de oposición al tratamiento.</li>
          <li>Derecho a la limitación del tratamiento.</li>
          <li>Derecho a la portabilidad de los datos, cuando sea aplicable.</li>
          <li>Derecho a retirar el consentimiento prestado.</li>
        </ul>

        <p style={styles.text}>
          Para ejercer estos derechos, el usuario puede enviar una solicitud a:
          <strong> soporte@porrafutbol.futbol</strong>, indicando el derecho que
          desea ejercer y aportando la información necesaria para verificar su
          identidad.
        </p>

        <h2 style={styles.subtitle}>11. Reclamaciones ante la AEPD</h2>

        <p style={styles.text}>
          Si el usuario considera que el tratamiento de sus datos personales no
          se ajusta a la normativa, puede presentar una reclamación ante la
          Agencia Española de Protección de Datos (AEPD), a través de su sitio
          web oficial: <strong>www.aepd.es</strong>.
        </p>

        <h2 style={styles.subtitle}>12. Seguridad</h2>

        <p style={styles.text}>
          La plataforma aplica medidas técnicas y organizativas razonables para
          proteger los datos personales frente a accesos no autorizados, pérdida,
          alteración o uso indebido. No obstante, ningún sistema conectado a
          Internet puede garantizar seguridad absoluta.
        </p>

        <h2 style={styles.subtitle}>13. Menores de edad</h2>

        <p style={styles.text}>
          La plataforma está dirigida a usuarios mayores de edad o, en su caso,
          a menores que participen bajo la supervisión y autorización de sus
          padres, tutores o representantes legales, cuando resulte legalmente
          procedente.
        </p>

        <p style={styles.text}>
          Si se detecta el uso no autorizado por parte de un menor, podrá
          procederse a la eliminación de la cuenta o limitación de acceso.
        </p>

        <h2 style={styles.subtitle}>14. Cambios en esta política</h2>

        <p style={styles.text}>
          La Política de Privacidad podrá actualizarse para reflejar cambios en
          la plataforma, proveedores técnicos, funcionalidades o normativa
          aplicable. La versión publicada en esta página será la vigente en cada
          momento.
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

  list: {
    color: "#cbd5e1",
    paddingLeft: "24px",
    lineHeight: 1.85,
    fontSize: "17px",
    margin: "0 0 18px",
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
