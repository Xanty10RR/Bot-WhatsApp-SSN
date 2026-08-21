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

export const VerificarIdentidad: any = addKeyword(MENU_IDS.SUBMENU_3.OPCION2)
  .addAnswer(
    [
      "🔐 *¿Usuario real?*\nIngresa tu usuario y contraseña separados por una coma.",
      "Ejemplo: `usuario, contraseña`",
      "",
      "💡 *¿Usuario invitado?*\nIngresa con las credenciales: `usuarioinvitado, usuarioinvitado` para ingresar",
      "*(Recuerda crear una requisición antes de aprobarla)*",
    ].join("\n"),
    { capture: true },
    async (ctx, { state, flowDynamic, gotoFlow }) => {
      const partes = ctx.body.split(",");

      if (partes.length !== 2) {
        await flowDynamic(
          "❌ Formato inválido. Usa el formato:\n*usuario, contraseña*",
        );
        await flowDynamic([
          {
            body: "¿Qué deseas hacer ahora?",
            buttons: [{ body: "🔁 Otro intento" }, { body: "🏠 Menú" }],
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
          // Si es invitado, ignoramos el filtro de departamento para que vea todas las requisiciones
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
                { body: "🏠 Menú" },
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
              buttons: [{ body: "🔁 Otro intento" }, { body: "🏠 Menú" }],
            },
          ]);
          return;
        }

        // Autenticación exitosa y mostrar registros
        const tablaAsignada = usuario.tabla_asignada;

        // Se obtiene el departamento del jefe desde la BD
        const deptoJefe = usuario.departamento;

        // AHORA se filtra por el departamento del jefe
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
            buttons: [{ body: "🔁 Otro intento" }, { body: "🏠 Menú" }],
          },
        ]);
      }
    },
  )

  // Captura el número y maneja si el usuario presionó "Otro intento" o "Menú"
  .addAnswer(
    "",
    { capture: true },
    async (ctx, { state, flowDynamic, fallBack, gotoFlow }) => {
      const input = ctx.body.trim().toLowerCase();

      // Si el usuario presiona el botón de reintentar o menú, redirigimos limpiamente
      if (input.includes("otro intento") || input.includes("reintentar")) {
        return gotoFlow(VerificarIdentidad);
      }
      if (input.includes("menú") || input.includes("menu")) {
        return gotoFlow(mainFlow);
      }

      const registros = (await state.get("registros")) || [];

      // Validar que sea un número estricto
      if (!/^\d+$/.test(input)) {
        return fallBack(
          "❌ Número inválido. Por favor, escribe un número de la lista:",
        );
      }

      const indice = parseInt(input, 10) - 1;

      // Validar que el número esté dentro del rango de la lista mostrada
      if (indice < 0 || indice >= registros.length) {
        return fallBack(
          "❌ Número inválido. Por favor, escribe un número de la lista:",
        );
      }

      const registro = registros[indice];
      const segundoValor = Object.values(registro)[1];

      await state.update({
        selectedRegistro: registro,
        numeroSolicitante: segundoValor,
      });

      // Datos de equisicion formateada
      const mensajeDetalle = [
        "📄 *Detalles del registro seleccionado:*",
        "",
        `👤 *Solicitante:* ${registro.nombre_solicitante}`,
        `📱 *Teléfono:* ${registro.usuario_whatsapp}`,
        `🪪 *Cédula:* ${registro.cedula_solicitante}`,
        `🏢 *Departamento:* ${registro.departamento}`,
        `⚠️ *Punto de venta o administrativo:* ${registro.asesor_o_administrativo}`,
        `📌 *Tipo de solicitud:* ${registro.tipo_solicitud}`,
        `🔰 *Tipo de elemento:* ${registro.tipo_elemento}`,
        `📝 *Descripción:* ${registro.descripcion}`,
        `📦 *Cantidad:* ${registro.cantidad}`,
        `💬 *Observaciones:* ${registro.observaciones || "Ninguna"}`,
        `📝 *Estado:* ${registro.estado || "Pendiente"}`,
        `🕒 *Fecha y hora:* ${new Date(registro.fecha_creacion).toLocaleDateString("es-CO")}`,
      ].join("\n");

      await flowDynamic(mensajeDetalle);

      await flowDynamic(
        [
          "🔍 *Selecciona una acción:*",
          "1. ✅ Aprobar",
          "2. ❌ Rechazar",
          "3. 🔍 Ver número",
          "4. 🏠 Menú principal",
        ].join("\n"),
      );
    },
  )
  // Paso 3: Captura inmediatamente la respuesta al menú de acciones (1, 2, 3 o 4)
  .addAnswer(
    "Elige una opción de acción:",
    { capture: true },
    async (ctx, { state, flowDynamic, gotoFlow, fallBack }) => {
      try {
        const input = ctx.body.trim();
        if (!/^\d+$/.test(input)) {
          return fallBack("❌ Opción inválida. Elige un número del 1 al 4:");
        }

        const opcion = parseInt(input, 10);
        const stateData = await state.getMyState();
        const selectedRegistro = stateData?.selectedRegistro;
        const tablaAsignada = stateData?.tablaAsignada;
        const usuario = stateData?.usuario;
        const numeroSolicitante = stateData?.numeroSolicitante;

        if (!selectedRegistro?.nombre_solicitante) {
          return fallBack("❌ No hay un registro seleccionado válido.");
        }

        if (opcion < 1 || opcion > 4) {
          return fallBack("❌ Opción inválida. Elige un número del 1 al 4:");
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

            await flowDynamic(
              [
                "🔍 *Selecciona una acción:*",
                "1. ✅ Aprobar",
                "2. ❌ Rechazar",
                "3. 🔍 Ver número",
                "4. 🏠 Menú principal",
              ].join("\n"),
            );
            return;
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