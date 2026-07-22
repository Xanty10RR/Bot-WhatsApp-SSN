/*
import { addKeyword, EVENTS } from "@builderbot/bot";
import { ConvenioService } from "../../services/convenio.service";
import { formatearConvenio } from "../../utils/formatearConvenio";
import { memory } from "./memory";
import { seleccionarConvenioFlow } from "./seleccionarConvenioFlow";
import { sugerenciaFlow } from "./sugerenciaFlow";

export const buscarFlow = addKeyword(EVENTS.ACTION).addAnswer(
  "✍️ Escribe el nombre del convenio, NIT, empresa o sigla.",
  {
    capture: true,
  },

  async (ctx, { flowDynamic, gotoFlow }) => {

  console.log("ENTRÓ A BUSCARFLOW");
  console.log(ctx.body);

  const texto = ctx.body.trim();

    const resultado = await ConvenioService.buscar(texto);

    const coincidencias = [
      ...resultado.bbva,
      ...resultado.agrario,
      ...resultado.aval,
    ];

    // No encontró nada
    if (coincidencias.length === 0) {

      const sugerencia = await ConvenioService.sugerir(texto);

      if (sugerencia && sugerencia.score >= 0.25) {

        memory[ctx.from] = {
          texto: sugerencia.nombre_convenio,
          resultados: [],
          sugerencia: sugerencia.nombre_convenio,
        };

        return gotoFlow(sugerenciaFlow);
      }

      await flowDynamic("❌ No encontré coincidencias.");
      return;
    }

    // Una sola coincidencia
    if (coincidencias.length === 1) {

      await flowDynamic(
        formatearConvenio(coincidencias[0])
      );

      return;
    }

    // Guardamos solamente lo necesario
    const resultados = coincidencias.map((c) => ({

      banco: c.banco,

      id:
        c.banco === "AVAL"
          ? String(c.nit)
          : String(c.codigo_convenio),

      nombre: c.nombre_convenio,

    }));

    memory[ctx.from] = {
      texto,
      resultados,
    };

    let mensaje = `🔎 Encontré *${resultados.length}* coincidencias.\n\n`;

    resultados.forEach((item, index) => {

      mensaje += `${index + 1}️⃣ ${item.nombre}\n`;
      mensaje += `🏦 ${item.banco}\n\n`;

    });

    mensaje += "✍️ Escribe el número del convenio.";

    await flowDynamic(mensaje);

    return gotoFlow(seleccionarConvenioFlow);

  }
);
*/