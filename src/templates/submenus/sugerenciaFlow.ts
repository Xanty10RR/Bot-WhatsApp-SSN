import { addKeyword } from "@builderbot/bot";
import { ConvenioService } from "../../services/convenio.service";
import { memory } from "./memory";
import { mostrarConvenio } from "../../utils/mostrarConvenio";
import { seleccionarConvenioFlow } from "./seleccionarConvenioFlow";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const sugerenciaFlow = addKeyword("__SUGERENCIA__").addAnswer(
  `🤔 ¿Quisiste decir el siguiente convenio?

✅ Responde *SI*

❌ Responde *NO* o escribe otro convenio.`,
  {
    capture: true,
  },
  async (ctx, { flowDynamic, gotoFlow }) => {
    const respuesta = ctx.body.trim().toUpperCase();

    const datos = memory[ctx.from];

    if (!datos) {
      await flowDynamic("⚠️ La búsqueda expiró.");
      return;
    }

    // ==========================
    // EL USUARIO ACEPTA LA SUGERENCIA
    // ==========================
    if (respuesta === "SI" || respuesta === "SÍ") {

      const resultado = await ConvenioService.buscar(datos.sugerencia!);

      const coincidencias = [
        ...resultado.bbva,
        ...resultado.agrario,
        ...resultado.aval,
      ];

      if (coincidencias.length === 0) {
        delete memory[ctx.from];

        await flowDynamic("❌ No encontré el convenio.");

        return;
      }

      // UNA SOLA COINCIDENCIA
      if (coincidencias.length === 1) {

        delete memory[ctx.from];

        await mostrarConvenio(
          coincidencias[0],
          flowDynamic,
          __dirname
        );

        return;
      }

      // VARIAS COINCIDENCIAS
      memory[ctx.from] = {
        texto: datos.sugerencia!,
        resultados: coincidencias.map((item) => ({
          banco: item.banco,
          id:
            item.banco === "AVAL"
              ? String(item.nit)
              : String(item.codigo_convenio),
          nombre: item.nombre_convenio,
        })),
      };

      let mensaje = `🔎 Encontré *${memory[ctx.from].resultados.length}* coincidencias.\n\n`;

      memory[ctx.from].resultados.forEach((item, index) => {
        mensaje += `${index + 1}️⃣ ${item.nombre}\n`;
        mensaje += `🏦 ${item.banco}\n\n`;
      });

      mensaje += "✍️ Escribe el número del convenio.";

      await flowDynamic(mensaje);

      return gotoFlow(seleccionarConvenioFlow);
    }

    // ==========================
    // EL USUARIO RECHAZA
    // ==========================
    if (respuesta === "NO") {

      delete memory[ctx.from];

      await flowDynamic(
        "✍️ Escribe nuevamente el nombre del convenio."
      );

      return;
    }

    // ==========================
    // EL USUARIO ESCRIBE OTRO CONVENIO
    // ==========================
    if (respuesta !== "SI" && respuesta !== "SÍ") {

      delete memory[ctx.from];

      return gotoFlow(seleccionarConvenioFlow);
    }
  }
);