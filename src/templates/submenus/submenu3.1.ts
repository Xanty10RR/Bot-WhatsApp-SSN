import { addKeyword } from "@builderbot/bot";
import { MENU_IDS } from "../constants";
import { Pool } from "pg";

// Configuración de PostgreSQL
const dbPort = Number(process.env.DB_PORT ?? "5432");

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: dbPort,
});

export const RequisicionSolicitud = addKeyword(MENU_IDS.SUBMENU_3.OPCION1)
  .addAnswer(
    "¡Vamos a crear una nueva requisición!.\nPor favor, dime tu *nombre completo*:",
    { capture: true },
    async (ctx, { state }) => {
      await state.update({ nombre: ctx.body });
    },
  )
  .addAnswer(
    "Por favor coloca tu *número de cédula* completo:",
    { capture: true },
    async (ctx, { state }) => {
      await state.update({ cedula: ctx.body });
    },
  )
  .addAnswer(
    [
      "Marca a qué *departamento* quieres enviar la requisición:",
      "",
      "1. 📦 Logística",
      "2. 👤 RRHH",
      "3. 💻 IT/Sistemas",
      "4. 💰 Comercial",
      "5. 🤔 Otros",
    ].join("\n"),
    { capture: true },
    async (ctx, { flowDynamic, state, fallBack }) => {
      const mapaDept: Record<string, string> = {
        "1": "Logística",
        "2": "RRHH",
        "3": "IT/Sistemas",
        "4": "Comercial",
        "5": "Otros",
      };

      const seleccion = ctx.body.trim();
      const departamento = mapaDept[seleccion];

      // Si la opción no existe en nuestro mapa, ejecutamos fallBack
      if (!departamento) {
        return fallBack(
          "❌ Opción no válida. Por favor responde con un número del 1 al 5.",
        );
      }

      await state.update({ departamento_destino: departamento });
      await flowDynamic(`Has seleccionado: *${departamento}*`);
    },
  )
  .addAnswer(
    "⚠️ Si es Asesor escriba el *código de punto de venta* o si es *administrativo marque 0000*:",
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      const input = ctx.body.trim();
      if (!/^\d+$/.test(input)) {
        return await flowDynamic(
          "❌ Formato inválido. Debes ingresar solo números.",
        );
      }
      await state.update({ asesor_o_administrativo: input });
    },
  )
  .addAnswer(
    [
      "Marca de qué tipo es tu solicitud:",
      "1. 🛒 Compras",
      "2. 🛠️ Mantenimiento",
      "3. 🚗 Transporte",
      "4. 🤖 Otros",
    ].join("\n"),
    { capture: true },
    async (ctx, { flowDynamic, state, fallBack }) => {
      const opcion = parseInt(ctx.body.trim());

      // Validamos si es un número válido entre 1 y 4
      if (isNaN(opcion) || opcion < 1 || opcion > 4) {
        // fallBack() detiene el flujo y vuelve a hacer EXACTAMENTE la misma pregunta
        return fallBack(
          "❌ Opción inválida. Por favor selecciona un número del 1 al 4.",
        );
      }

      // Mapeamos el número a texto legible si lo deseas
      const tipos = ["Compras", "Mantenimiento", "Transporte", "Otros"];
      const tipoSeleccionado = tipos[opcion - 1];

      await state.update({ tipo_solicitud: tipoSeleccionado });
    },
  )
  .addAnswer(
    [
      "Marca de qué tipo es tu Elemento:",
      "1. 💎 Activo",
      "2. ♻️ Insumo",
      "3. 🛠️ Repuesto",
      "4. 💼 Servicio",
    ].join("\n"),
    { capture: true },
    async (ctx, { flowDynamic, state, fallBack }) => {
      const opcion = parseInt(ctx.body.trim());

      // Validamos si es un número válido entre 1 y 4
      if (isNaN(opcion) || opcion < 1 || opcion > 4) {
        return fallBack(
          "❌ Opción inválida. Por favor selecciona un número del 1 al 4.",
        );
      }

      const tipos = ["Activo", "Insumo", "Repuesto", "Servicio"];
      const tipoSeleccionado = tipos[opcion - 1];

      await state.update({ tipo_elemento: tipoSeleccionado });
    },
  )
  .addAnswer(
    "Por favor escriba una descripción detallada:",
    { capture: true },
    async (ctx, { state }) => {
      await state.update({ descripcion: ctx.body });
    },
  )
  .addAnswer(
    "Indique la cantidad necesaria:",
    { capture: true },
    async (ctx, { flowDynamic, state }) => {
      // Validamos que sea un número
      if (isNaN(parseInt(ctx.body))) {
        await flowDynamic("❌ La cantidad debe ser un número.");
        return;
      }
      await state.update({ cantidad: parseInt(ctx.body) });
    },
  )
  .addAnswer(
    "Agregue alguna observación adicional:",
    { capture: true },
    async (ctx, { state }) => {
      await state.update({ observaciones: ctx.body });
    },
  )
  .addAction(async (ctx, { state, flowDynamic }) => {
    const datos = state.getMyState();

    try {
      // Ahora es una sola inserción en una sola tabla
      await pool.query(
        `INSERT INTO requisiciones (
                usuario_whatsapp, nombre_solicitante, cedula_solicitante, departamento, 
                asesor_o_administrativo, tipo_solicitud, tipo_elemento, 
                descripcion, cantidad, observaciones
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          ctx.from,
          datos.nombre,
          datos.cedula,
          datos.departamento_destino,
          datos.asesor_o_administrativo,
          datos.tipo_solicitud,
          datos.tipo_elemento,
          datos.descripcion,
          datos.cantidad,
          datos.observaciones,
        ],
      );

      await flowDynamic(
        "✅ Solicitud guardada exitosamente. Se ha notificado al jefe del área.",
      );
    } catch (error) {
      console.error("Error al guardar:", error);
      await flowDynamic("❌ Error al guardar la requisición.");
    }
    await flowDynamic([
      {
        body: "¿Qué deseas hacer ahora?",
        buttons: [
          { body: "📝 Nueva requisición" },
          { body: "🏠 Menú principal" },
        ],
      },
    ]);
  })
  .addAction({ capture: true }, async (ctx, { gotoFlow }) => {
    if (ctx.body.includes("Nueva") || ctx.body.includes("📝"))
      return gotoFlow(RequisicionSolicitud);
    const { mainFlow } = await import("../mainFlow");
    return gotoFlow(mainFlow);
  });
