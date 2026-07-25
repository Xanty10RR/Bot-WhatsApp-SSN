import { ConvenioService } from "../../services/convenio.service";
import { formatearBusqueda } from "../../utils/formatearBusqueda";
import { addKeyword } from "@builderbot/bot";
import { MENU_IDS } from "../constants";
import { formatearConvenio } from "../../utils/formatearConvenio";
import { existsSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mostrarMenu = async (flowDynamic: any) => {
  await flowDynamic(`

━━━━━━━━━━━━━━

🔄 Escribe *buscar* para hacer otra consulta.

🏠 Escribe *menu* para volver al inicio.

📞 Escribe *soporte* para hablar con soporte.

━━━━━━━━━━━━━━
`);
};

// Simple in-memory storage for search results per user (phone or id)
const memory: Record<string, any[]> = {};

export const submenu1Flow = addKeyword(MENU_IDS.PRINCIPAL.OPCION1)
  .addAnswer(
    "✍️ Escribe el nombre del convenio, NIT, empresa o sigla.",
    {
      capture: true,
    },
    async (ctx, { flowDynamic }) => {
      const texto = ctx.body.trim();

      const resultado = await ConvenioService.buscar(texto);

      const coincidencias = [
        ...resultado.bbva,
        ...resultado.agrario,
        ...resultado.aval,
      ];

      if (coincidencias.length === 0) {
        await flowDynamic("❌ No encontré coincidencias.");
        return;
      }

      if (coincidencias.length === 1) {
        const convenio = coincidencias[0];

        await flowDynamic(formatearConvenio(convenio));

        await mostrarMenu(flowDynamic);

        return;
      }

      // Guardamos resultados
      memory[ctx.from] = coincidencias;

      let mensaje = `🔎 Encontré *${coincidencias.length}* coincidencias.\n\n`;

      coincidencias.forEach((item, index) => {
        mensaje += `${index + 1}️⃣ ${item.nombre_convenio}\n`;
        mensaje += `🏦 ${item.banco}\n\n`;
      });

      mensaje += "✍️ Escribe el número del convenio.";

      await flowDynamic(mensaje);
    },
  )

  .addAnswer(
    "",
    {
      capture: true,
    },
    async (ctx, { flowDynamic }) => {
      const lista = memory[ctx.from];

      if (!lista) {
        await flowDynamic("⚠️ La búsqueda expiró.");
        return;
      }

      const numero = parseInt(ctx.body);

      if (isNaN(numero) || numero < 1 || numero > lista.length) {
        await flowDynamic("❌ Número inválido.");
        return;
      }

      const convenio = lista[numero - 1];

      await flowDynamic(formatearConvenio(convenio));

      await mostrarMenu(flowDynamic);

      delete memory[ctx.from];

      // Next step: ask user if they want to search again, go to menu or contact support
    },
  )

  .addAnswer(
    "",
    {
      capture: true,
    },
    async (ctx: any, { gotoFlow, flowDynamic }: any) => {
      const opcion = ctx.body.trim().toLowerCase();

      if (opcion === "buscar") {
        delete memory[ctx.from];
        return gotoFlow(submenu1Flow);
      }

      if (opcion === "menu") {
        delete memory[ctx.from];
        await flowDynamic("🏠 Volviendo al inicio.");
        return;
      }

      if (opcion === "soporte") {
        await flowDynamic(
          "📞 Soporte\n\n323493779\nLunes a Viernes\n8:00 a.m. - 6:00 p.m."
        );
        return;
      }

      await flowDynamic("❌ Escribe: buscar, menu o soporte.");
    },
  );
