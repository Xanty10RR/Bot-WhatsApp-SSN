import { ConvenioService } from "../../services/convenio.service";
import { addKeyword } from "@builderbot/bot";
import { mainFlow } from "../mainFlow";
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

const memory: Record<string, any[]> = {};
const sugerencias: Record<string, string> = {};

export const submenu1Flow = addKeyword(MENU_IDS.PRINCIPAL.OPCION1)
  // Pide, busca y muestra resultados de convenios
  .addAnswer(
    "✍️ Escribe el nombre del convenio, NIT, empresa o sigla.",
    {
      capture: true,
    },
    async (ctx, { flowDynamic }) => {
      let texto = ctx.body.trim();

      // Si el usuario respondió "si" y existe una sugerencia,
      // usamos el convenio sugerido.
      if (texto.toLowerCase() === "si" && sugerencias[ctx.from]) {
        texto = sugerencias[ctx.from];
        delete sugerencias[ctx.from];
      }

      const resultado = await ConvenioService.buscar(texto);

      const coincidencias = [
        ...resultado.bbva,
        ...resultado.agrario,
        ...resultado.aval,
      ];

      if (coincidencias.length === 0) {
        const sugerencia = await ConvenioService.sugerir(texto);

        if (sugerencia && sugerencia.score >= 0.35) {
          sugerencias[ctx.from] = sugerencia.nombre_convenio;

          await flowDynamic(
            `❌ No encontré coincidencias para:

"${texto}"

🤔 ¿Quisiste decir?

📋 *${sugerencia.nombre_convenio}*

✅ Escribe *si* para consultar este convenio.

🔄 O escribe otro nombre para realizar una nueva búsqueda.`,
          );

          return;
        }

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

  // Se ejecuta solo cuando había varias coincidencias lee, valida, muestra convenio y menu
  .addAction(
    { capture: true }, 
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

    delete memory[ctx.from];

    await mostrarMenu(flowDynamic);
    // Next step: ask user if they want to search again, go to menu or contact support
  })

  // Se ejecuta después de mostrar el convenio y el menu, valida la opción y redirige
  .addAnswer(
    "",
    {
      capture: true,
    },
    async (ctx, { flowDynamic, gotoFlow }) => {
      const opcion = ctx.body.trim().toLowerCase();

      if (opcion === "buscar") {
        delete memory[ctx.from];
        return gotoFlow(submenu1Flow);
      }

      if (opcion === "menu") {
        delete memory[ctx.from];
        return gotoFlow(mainFlow);
      }

      if (opcion === "soporte") {
        await flowDynamic(`📞 *Soporte Técnico*
                📱 323493779           
                🕗 Lunes a Viernes
                7:00 a.m. - 12:00 p.m.
                12:00 p.m. - 6:00 p.m.`);
        return;
      }

      await flowDynamic(
        "❌ Opción no válida.\n\nEscribe *buscar*, *menu* o *soporte*.",
      );
    },
  );
