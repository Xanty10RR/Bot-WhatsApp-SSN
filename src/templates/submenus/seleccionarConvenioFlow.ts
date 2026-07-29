import { addKeyword } from "@builderbot/bot";
import { ConvenioService } from "../../services/convenio.service";
import { mostrarConvenio } from "../../utils/mostrarConvenio";
import { memory } from "./memory";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const seleccionarConvenioFlow = addKeyword("__SELECCIONAR__").addAnswer(
  "",
  {
    capture: true,
  },
  async (ctx, { flowDynamic }) => {

    console.log("➡️ seleccionarConvenioFlow:", ctx.body);

    const datos = memory[ctx.from];

    if (!datos) {
      await flowDynamic("⚠️ La búsqueda expiró.");
      return;
    }

    const numero = Number(ctx.body);

    if (isNaN(numero)) {
      await flowDynamic(
        "❌ Debes escribir únicamente el número del convenio."
      );
      return;
    }

    if (numero < 1 || numero > datos.resultados.length) {
      await flowDynamic(
        `❌ Debes escribir un número entre 1 y ${datos.resultados.length}.`
      );
      return;
    }

    const seleccionado = datos.resultados[numero - 1];

    const convenio = await ConvenioService.obtenerPorId(
      seleccionado.banco,
      seleccionado.id
    );

    if (!convenio) {
      await flowDynamic("❌ No pude encontrar ese convenio.");
      return;
    }

    delete memory[ctx.from];

    await mostrarConvenio(
      convenio,
      flowDynamic,
      __dirname
    );

  }
);