import { addKeyword } from "@builderbot/bot";
import { ConvenioService } from "../../services/convenio.service";
import { formatearConvenio } from "../../utils/formatearConvenio";
import { memory } from "./memory";
import { seleccionarConvenioFlow } from "./seleccionarConvenioFlow";
import { sugerenciaFlow } from "./sugerenciaFlow";

export const buscarFlow = addKeyword("__BUSCAR__").addAnswer(
  "✍️ Escribe el nombre del convenio, NIT, empresa o sigla.",
  {
    capture: true,
  },
  async (ctx, { flowDynamic, gotoFlow }) => {
    const texto = ctx.body.trim();

    const resultado = await ConvenioService.buscar(texto);

    const coincidencias = [
      ...resultado.bbva,
      ...resultado.agrario,
      ...resultado.aval,
    ];

    if (coincidencias.length === 0) {
      const sugerencia = await ConvenioService.sugerir(texto);

      if (sugerencia && sugerencia.score >= 0.25) {
        memory[ctx.from] = {
          texto: sugerencia.nombre_convenio,
          coincidencias: [],
          sugerencia: sugerencia.nombre_convenio,
        };

        return gotoFlow(sugerenciaFlow);
      }

      await flowDynamic("❌ No encontré coincidencias.");
      return;
    }

    if (coincidencias.length === 1) {
      await flowDynamic(formatearConvenio(coincidencias[0]));
      return;
    }

    memory[ctx.from] = {
      texto,
      coincidencias,
    };

    return gotoFlow(seleccionarConvenioFlow);
  }
);