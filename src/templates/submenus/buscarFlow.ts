import { addKeyword, EVENTS } from "@builderbot/bot";
import { ConvenioService } from "../../services/convenio.service";
import { mostrarConvenio } from "../../utils/mostrarConvenio";
import { memory } from "./memory";
import { sugerenciaFlow } from "./sugerenciaFlow";
import { seleccionarConvenioFlow } from "./seleccionarConvenioFlow";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const buscarFlow = addKeyword(EVENTS.ACTION).addAnswer(
  "✍️ Escribe el nombre del convenio, NIT, empresa o sigla.",
  {
    capture: true,
  },
  async (ctx, { flowDynamic, gotoFlow }) => {
    const texto = ctx.body.trim();

    console.log("🔎 Buscar:", texto);

    const resultado = await ConvenioService.buscar(texto);

    const coincidencias = [
      ...resultado.bbva,
      ...resultado.agrario,
      ...resultado.aval,
    ];

    // ==========================
    // NO HAY COINCIDENCIAS
    // ==========================
    if (coincidencias.length === 0) {
      const sugerencia = await ConvenioService.sugerir(texto);

      if (sugerencia && sugerencia.score >= 0.25) {
        memory[ctx.from] = {
          texto,
          sugerencia: sugerencia.nombre_convenio,
          resultados: [],
        };

        return gotoFlow(sugerenciaFlow);
      }

      await flowDynamic(
        `❌ No encontré coincidencias para:

"${texto}"

✍️ Escribe otro nombre para realizar una nueva búsqueda.`
      );

      return;
    }

    // ==========================
    // UNA COINCIDENCIA
    // ==========================
    if (coincidencias.length === 1) {
      delete memory[ctx.from];

      await mostrarConvenio(
        coincidencias[0],
        flowDynamic,
        __dirname
      );

      return;
    }

    // ==========================
    // VARIAS COINCIDENCIAS
    // ==========================
    memory[ctx.from] = {
      texto,
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
);