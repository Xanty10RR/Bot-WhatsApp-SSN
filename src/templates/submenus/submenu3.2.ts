import { addKeyword } from "@builderbot/bot";
import { MENU_IDS } from "../constants";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { mainFlow } from "../mainFlow";

// Configuración de PostgreSQL
export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
});

export const VerificarIdentidad = addKeyword(MENU_IDS.SUBMENU_3.OPCION2)
  .addAnswer(
    [
      "🔐 *¿Usuario real?*\nIngresa tu usuario y contraseña separados por una coma.",
      "Ejemplo: `usuario,contraseña`",
      "",
      "💡 *¿Usuario invitado?*\nIngresa con las credenciales: `usuarioinvitado,usuarioinvitado` para ingresar",
      "*(Recuerda crear una requisición antes de aprobarla)*",
    ].join("\n"),
    { capture: true },
    async (ctx, { state, flowDynamic, gotoFlow }) => {
      const partes = ctx.body.split(",");

      if (partes.length !== 2) {
        await flowDynamic(
          "❌ Formato inválido. Usa el *formato*:\nusuario, contraseña",
        );
        await flowDynamic([
          {
            body: "¿Qué deseas hacer ahora?",
            buttons: [
              { body: "🔁 Otro intento" },
              { body: "🏠 Menú principal" },
            ],
          },
        ]);
        return;
      }

      const [usuarioIngresado, claveIngresada] = partes.map((p) => p.trim());
      try {
        // Lógica para: usuarioinvitado
        if (
          usuarioIngresado === "usuarioinvitado" &&
          claveIngresada === "usuarioinvitado"
        ) {
          // Si es invitado, ignoramos el filtro de departamento para que vea todo
          const registros = await pool.query(
            "SELECT * FROM requisiciones WHERE estado = 'pendiente'",
          );
          const filas = registros.rows;

          if (filas.length === 0) {
            await flowDynamic("📭 No hay requisiciones pendientes.");
            return gotoFlow(mainFlow);
          }

          await state.update({
            usuario: "invitado",
            tablaAsignada: "requisiciones",
            registros: filas,
          });

          const opciones = filas.map(
            (f, i) => `${i + 1}. ${f.nombre_solicitante} - ${f.tipo_solicitud}`,
          );
          await flowDynamic([
            "✅ *Modo invitado activado*\nRegistros disponibles:",
            ...opciones,
          ]);
          await flowDynamic(
            "✏️ Escribe el *número del registro* que deseas ver en detalle.",
          );
          return;
        }

        // Lógica para: jefes reales de la empresa
        const result = await pool.query(
          "SELECT * FROM usuarios_aprobadores WHERE usuario = $1",
          [usuarioIngresado],
        );

        if (result.rows.length === 0) {
          await flowDynamic("❌ Usuario no encontrado.");
          await flowDynamic([
            {
              body: "¿Qué deseas hacer ahora?",
              buttons: [
                { body: "🔁 Otro intento" },
                { body: "🏠 Menú principal" },
              ],
            },
          ]);
          return;
        }

        const usuario = result.rows[0];
        const claveValida = await bcrypt.compare(claveIngresada, usuario.clave);

        if (!claveValida) {
          await flowDynamic("❌ Contraseña incorrecta.");
          await flowDynamic([
            {
              body: "¿Qué deseas hacer ahora?",
              buttons: [
                { body: "🔁 Otro intento" },
                { body: "🏠 Menú principal" },
              ],
            },
          ]);
          return;
        }

        // Autenticación exitosa y mostrar registros
        const tablaAsignada = usuario.tabla_asignada;
        const deptoJefe = usuario.departamento; // Obtenemos el departamento del jefe desde la BD

        // AHORA filtramos por el departamento del jefe
        const query = `SELECT * FROM ${tablaAsignada} WHERE departamento = $1 AND estado = 'pendiente'`;
        const registros = await pool.query(query, [deptoJefe]);
        const filas = registros.rows;

        if (filas.length === 0) {
          await flowDynamic("📭 No hay registros en tu tabla asignada.");
          return gotoFlow(mainFlow);
        }

        const opciones = filas.map(
          (fila, i) =>
            `${i + 1}. ${fila.nombre_solicitante} - ${fila.tipo_solicitud}`,
        );

        await state.update({
          usuario: usuarioIngresado,
          tablaAsignada,
          registros: filas,
        });

        await flowDynamic([
          "✅ Autenticación exitosa. \n 📋 Estos son los registros disponibles:",
          ...opciones,
        ]);
        await flowDynamic(
          "✏️ Escribe el *número del registro* que deseas ver en detalle.",
        );
      } catch (error) {
        console.error("Error al verificar identidad:", error);
        await flowDynamic("❌ Ocurrió un error al procesar tu solicitud.");
        await flowDynamic([
          {
            body: "¿Qué deseas hacer ahora?",
            buttons: [
              { body: "🔁 Otro intento" },
              { body: "🏠 Menú principal" },
            ],
          },
        ]);
      }
    },
  )
  // 👇 AQUÍ AGREGAMOS ESTE PASO EXTRA PARA CAPTURAR EL NÚMERO Y MOSTRAR EL DETALLE BONITO
  // 1. Captura el número del registro, muestra el detalle y CAPTURA DIRECTAMENTE LA ACCIÓN (1, 2, 3 o 4)
  // PASO 1: Captura el número de la lista (1, 2, 3...) y muestra el detalle + opciones
  .addAnswer("", { capture: true }, async (ctx, { state, flowDynamic }) => {
    const registros = (await state.get("registros")) || [];
    const indice = parseInt(ctx.body.trim()) - 1;

    if (isNaN(indice) || indice < 0 || indice >= registros.length) {
      await flowDynamic(
        "❌ Número inválido. Por favor escribe un número de la lista.",
      );
      return;
    }

    const registro = registros[indice];
    const segundoValor = Object.values(registro)[1];

    await state.update({
      selectedRegistro: registro,
      numeroSolicitante: segundoValor,
    });

    // Burbuja 1: Detalles
    const mensajeDetalle = [
      "📄 *Detalles del registro seleccionado:*",
      "",
      `👤 *Solicitante:* ${registro.nombre_solicitante}`,
      `🪪 *Cédula:* ${registro.cedula_solicitante}`,
      `🏢 *Departamento:* ${registro.departamento}`,
      `📌 *Tipo:* ${registro.tipo_solicitud} (${registro.tipo_elemento})`,
      `📦 *Cantidad:* ${registro.cantidad}`,
      `📝 *Descripción:* ${registro.descripcion}`,
      `⚠️ *Observaciones:* ${registro.observaciones || "Ninguna"}`,
      `🕒 *Fecha:* ${new Date(registro.fecha_creacion).toLocaleDateString("es-CO")}`,
    ].join("\n");

    await flowDynamic(mensajeDetalle);

    // Burbuja 2: Menú de acciones
    await flowDynamic(
      [
        "🔍 *Selecciona una acción:*",
        "1. ✅ Aprobar",
        "2. ❌ Rechazar",
        "3. 🔍 Ver número",
        "4. 🏠 Menú principal",
      ].join("\n"),
    );
  })
  // PASO 2: Captura inmediatamente la respuesta al menú (1, 2, 3 o 4)
  .addAnswer(
    "",
    { capture: true },
    async (ctx, { state, flowDynamic, gotoFlow }) => {
      try {
        const opcion = parseInt(ctx.body.trim().replace(/\D/g, ""));
        const stateData = await state.getMyState();
        const selectedRegistro = stateData?.selectedRegistro;
        const tablaAsignada = stateData?.tablaAsignada;
        const usuario = stateData?.usuario;
        const numeroSolicitante = stateData?.numeroSolicitante;

        if (!selectedRegistro) {
          await flowDynamic(
            "❌ No hay un registro seleccionado. Por favor, comienza de nuevo.",
          );
          return gotoFlow(mainFlow);
        }

        if (isNaN(opcion) || opcion < 1 || opcion > 4) {
          await flowDynamic("❌ Opción inválida. Elige un número del 1 al 4.");
          return;
        }

        switch (opcion) {
          case 1: {
            const idRegistro = selectedRegistro.id;
            await pool.query(
              `INSERT INTO registro_aprobaciones (datos_completos, estado, aprobador, tabla_origen, fecha_decision) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
              [
                JSON.stringify(selectedRegistro),
                "aprobado",
                usuario,
                tablaAsignada,
              ],
            );
            await pool.query(`DELETE FROM ${tablaAsignada} WHERE id = $1`, [
              idRegistro,
            ]);
            await flowDynamic(
              "🟢 Solicitud aprobada y guardada en base de datos.",
            );
            return gotoFlow(mainFlow);
          }
          case 2: {
            const idRegistro = selectedRegistro.id;
            await pool.query(
              `INSERT INTO registro_aprobaciones (datos_completos, estado, aprobador, tabla_origen, fecha_decision) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
              [
                JSON.stringify(selectedRegistro),
                "rechazado",
                usuario,
                tablaAsignada,
              ],
            );
            await pool.query(`DELETE FROM ${tablaAsignada} WHERE id = $1`, [
              idRegistro,
            ]);
            await flowDynamic(
              "🔴 Solicitud rechazada y guardada en base de datos.",
            );
            return gotoFlow(mainFlow);
          }
          case 3: {
            if (!numeroSolicitante) {
              await flowDynamic("❌ No se encontró número de contacto.");
              break;
            }
            await flowDynamic(
              `📱 Número del solicitante:\n${numeroSolicitante}`,
            );

            // Volvemos a mostrar el menú de acciones para que el usuario no pierda el hilo
            await flowDynamic(
              [
                "🔍 *Selecciona una acción:*",
                "1. ✅ Aprobar",
                "2. ❌ Rechazar",
                "3. 🔍 Ver número",
                "4. 🏠 Menú principal",
              ].join("\n"),
            );
            return; // Mantiene la captura abierta esperando que elijas otra opción
          }
          case 4:
            return gotoFlow(mainFlow);
        }
      } catch (error) {
        console.error("Error en acción:", error);
        await flowDynamic(
          "❌ Ocurrió un error al procesar en la base de datos.",
        );
        return gotoFlow(mainFlow);
      }
    },
  );