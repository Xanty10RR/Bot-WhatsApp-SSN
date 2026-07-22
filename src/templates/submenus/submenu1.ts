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
const memory: Record<string, { texto: string; coincidencias: any[] }> = {};

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
        const respuesta = formatearConvenio(coincidencias[0]);

        await flowDynamic(respuesta);

        return;
      }

      // Guardamos resultados como un objeto en memoria para el usuario
      memory[ctx.from] = {
        texto,
        coincidencias,
      };

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
      const datos = memory[ctx.from];

      if (!datos) {
        await flowDynamic("⚠️ La búsqueda expiró.");
        return;
      }

      const lista = datos.coincidencias;

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

      const respuesta = formatearConvenio(convenio);

      await flowDynamic(respuesta);

      const nit = convenio.nit;

      if (nit) {
        const imagePath = resolve(__dirname, "../../images", `${nit}.png`);

        if (existsSync(imagePath)) {
          await flowDynamic([
            {
              body: "🖼️ Imagen del convenio",
              media: imagePath,
            },
          ]);
        }
      }

      delete memory[ctx.from];

      await mostrarMenu(flowDynamic);
    },
  );
