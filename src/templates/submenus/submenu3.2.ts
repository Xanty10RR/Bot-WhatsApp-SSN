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
    "🔐 Por favor ingresa tu usuario y contraseña separados por una coma. Ejemplo:\n`soporte,1234`",
    { capture: true },
    async (ctx, { state, flowDynamic }) => {
      const partes = ctx.body.split(",");

      if (partes.length !== 2) {
        await flowDynamic(
          "❌ Formato inválido. Usa el formato: usuario,contraseña",
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

        // ✅ Autenticación exitosa y mostrar registros
        const tablaAsignada = usuario.tabla_asignada;
        const registros = await pool.query(`SELECT * FROM ${tablaAsignada}`);
        const filas = registros.rows;

        if (filas.length === 0) {
          await flowDynamic("📭 No hay registros en tu tabla asignada.");
          return { gotoFlow: mainFlow };
        }

        const opciones = filas.map(
          (fila, i) =>
            `${i + 1}. ${fila[Object.keys(fila)[0]]} - ${fila[Object.keys(fila)[1]]}`,
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
          "✏️ Escribe el número del registro que deseas ver en detalle.",
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
  .addAnswer(
    "",
    { capture: true },
    async (ctx, { state, flowDynamic, gotoFlow }) => {
      const seleccion = parseInt(ctx.body.trim().replace(/\D/g, ""));
      const registros = await state.get("registros");

      if (
        !registros ||
        isNaN(seleccion) ||
        seleccion < 1 ||
        seleccion > registros.length
      ) {
        await flowDynamic("❌ Selección inválida. Volviendo al menú...");
        return { gotoFlow: mainFlow };
      }

      const fila = registros[seleccion - 1];
      const segundoValor = Object.values(fila)[1];
      const detalle = Object.entries(fila)
        .map(([clave, valor]) => `🔹 ${clave}: ${valor}`)
        .join("\n");

      await state.update({
        selectedRegistro: fila,
        numeroSolicitante: segundoValor,
      });

      await flowDynamic(`📄 Detalles del registro seleccionado:\n${detalle}`);
      await flowDynamic(
        [
          "🔍 Selecciona una acción:",
          "1. ✅ Aprobar",
          "2. ❌ Rechazar",
          "3. 📞 Ver número",
          "4. 🏠 Menú principal",
        ].join("\n"),
      );
    },
  )

  .addAction(
    { capture: true },
    async (ctx, { state, flowDynamic, gotoFlow }) => {
      try {
        const opcion = parseInt(ctx.body.trim().replace(/\D/g, ""));
        const { numeroSolicitante, selectedRegistro, tablaAsignada, usuario } =
          await state.getMyState();

        if (isNaN(opcion) || opcion < 1 || opcion > 4) {
          throw new Error("Opción inválida");
        }
        // Validación de opción
        if (isNaN(opcion) || opcion < 1 || opcion > 4) {
          throw new Error("Opción inválida");
        }

        switch (opcion) {
          case 1: {
            // Aprobar - Nota los {} que crean un nuevo ámbito
            const estado = "aprobado";
            const idRegistro = selectedRegistro.id;

            await pool.query(
              `
                        INSERT INTO registro_aprobaciones (
                            datos_completos,
                            estado,
                            aprobador,
                            tabla_origen,
                            fecha_decision
                        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
              [
                JSON.stringify(selectedRegistro),
                estado,
                usuario,
                tablaAsignada,
              ],
            );
            await pool.query(
              `
                        DELETE FROM ${tablaAsignada}
                        WHERE id = $1`,
              [idRegistro],
            );

            await flowDynamic(
              "🟢 Solicitud aprobada y guardada en base de datos",
            );
            break;
          }

          case 2: {
            // Rechazar - Nota los {} que crean un nuevo ámbito
            const estado = "rechazado";
            const idRegistro = selectedRegistro.id;

            await pool.query(
              `
                        INSERT INTO registro_aprobaciones (
                            datos_completos,
                            estado,
                            aprobador,
                            tabla_origen,
                            fecha_decision
                        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
              [
                JSON.stringify(selectedRegistro),
                estado,
                usuario,
                tablaAsignada,
              ],
            );
            await pool.query(
              `
                        DELETE FROM ${tablaAsignada}
                        WHERE id = $1`,
              [idRegistro],
            );

            await flowDynamic(
              "🔴 Solicitud rechazada y guardada en base de datos",
            );
            break;
          }

          case 3: // Ver número
            if (!numeroSolicitante) {
              throw new Error("No se encontró número de contacto");
            }
            await flowDynamic(
              `📱 Número del solicitante:\n${numeroSolicitante}`,
            );
            break;

          case 4: // Menú principal
            return gotoFlow(mainFlow);
        }
      } catch (error) {
        console.error("Error en acción:", error);
        await flowDynamic(
          "❌ Ocurrió un error al procesar. Volviendo al menú...",
        );
      }

      return gotoFlow(mainFlow);
    },
  )
  .addAction({ capture: true }, async (ctx, { gotoFlow }) => {
    if (ctx.body.includes("Otro") || ctx.body.includes("🔁")) {
      return gotoFlow(VerificarIdentidad);
    }
    if (ctx.body.includes("Menú") || ctx.body.includes("🏠")) {
      return gotoFlow(mainFlow);
    }
  }
);