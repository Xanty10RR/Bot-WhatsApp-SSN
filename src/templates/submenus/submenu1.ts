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
    async (ctx, { flowDynamic, provider }) => {
      const texto = ctx.body.trim();

      const resultado = await ConvenioService.buscar(texto);

      const coincidencias = [
        ...resultado.bbva,
        ...resultado.agrario,
        ...resultado.aval,
      ];

      if (coincidencias.length === 0) {
        const sugerencia = await ConvenioService.sugerir(texto);

        console.log("SUGERENCIA:");
        console.dir(sugerencia, { depth: null });

        if (sugerencia && sugerencia.score >= 0.25) {
          await provider.sendButtons(
            ctx.from,
            [
              {
                body: "✅ Sí",
                id: "SUGERENCIA_SI",
              },
              {
                body: "❌ No",
                id: "SUGERENCIA_NO",
              },
            ],
            `🤔 ¿Quisiste decir *${sugerencia.nombre_convenio}*?`,
          );

          memory[ctx.from] = {
            texto: sugerencia.nombre_convenio,
            coincidencias: [],
          };

          return;
        }

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
      console.log("CTX COMPLETO");
      console.dir(ctx, { depth: null });

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

      const respuestaUsuario = ctx.body.trim().toUpperCase();

      console.log("BOTÓN:", ctx.body);

      if (
        respuestaUsuario === "SÍ" ||
        respuestaUsuario === "SI" ||
        respuestaUsuario === "✅ SÍ"
      ) {
        const sugerencia = memory[ctx.from];

        if (!sugerencia) {
          await flowDynamic("⚠️ La sugerencia expiró.");
          return;
        }

        const nuevoResultado = await ConvenioService.buscar(sugerencia.texto);

        const nuevasCoincidencias = [
          ...nuevoResultado.bbva,
          ...nuevoResultado.agrario,
          ...nuevoResultado.aval,
        ];

        if (nuevasCoincidencias.length === 1) {
          await flowDynamic(formatearConvenio(nuevasCoincidencias[0]));

          delete memory[ctx.from];
          return;
        }

        memory[ctx.from] = {
          texto: sugerencia.texto,
          coincidencias: nuevasCoincidencias,
        };

        let mensaje = `🔎 Encontré *${nuevasCoincidencias.length}* coincidencias.\n\n`;

        nuevasCoincidencias.forEach((item, index) => {
          mensaje += `${index + 1}️⃣ ${item.nombre_convenio}\n`;
          mensaje += `🏦 ${item.banco}\n\n`;
        });

        mensaje += "✍️ Escribe el número del convenio.";

        await flowDynamic(mensaje);

        return;
      }

      if (
        respuestaUsuario === "NO" || 
        respuestaUsuario === "❌ NO"
      ) {
        delete memory[ctx.from];

        await flowDynamic("✍️ Escribe nuevamente el nombre del convenio.");

        return;
      }

      if (isNaN(numero) || numero < 1 || numero > lista.length) {
        await flowDynamic("❌ Número inválido.");
        return;
      }

      const convenio = lista[numero - 1];

      const respuesta = formatearConvenio(convenio);

      await flowDynamic(respuesta);

      const nit = convenio.nit;

      const extensiones = ["png", "jpg", "jpeg"];

      for (const ext of extensiones) {
        const imagePath = resolve(__dirname, "images", `${nit}.${ext}`);

        if (existsSync(imagePath)) {
          await flowDynamic([
            {
              body: "🖼️ Imagen del convenio",
              media: imagePath,
            },
          ]);

          break;
        }
      }

      delete memory[ctx.from];

      await mostrarMenu(flowDynamic);
    },
  );
