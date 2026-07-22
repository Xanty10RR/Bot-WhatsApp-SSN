import { addKeyword } from "@builderbot/bot";
import { ConvenioService } from "../../services/convenio.service";
import { memory } from "./memory";
import { seleccionarConvenioFlow } from "./seleccionarConvenioFlow";

export const sugerenciaFlow = addKeyword("__SUGERENCIA__").addAnswer(
  `🤔 ¿Es el convenio que buscabas?

Responde:

✅ SI

❌ NO`,
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

    if (respuesta === "SI" || respuesta === "SÍ") {

      const resultado =
        await ConvenioService.buscar(datos.sugerencia!);

      const coincidencias = [
        ...resultado.bbva,
        ...resultado.agrario,
        ...resultado.aval,
      ];

      if (coincidencias.length === 0) {
        await flowDynamic("❌ No encontré el convenio.");
        return;
      }

      if (coincidencias.length === 1) {

        memory[ctx.from] = {
          texto: datos.sugerencia!,
          resultados: [
            {
              banco: coincidencias[0].banco,
              id:
                coincidencias[0].banco === "AVAL"
                  ? String(coincidencias[0].nit)
                  : String(coincidencias[0].codigo_convenio),
              nombre: coincidencias[0].nombre_convenio,
            },
          ],
        };

        return gotoFlow(seleccionarConvenioFlow);
      }

      const resultados = coincidencias.map((c) => ({
        banco: c.banco,
        id:
          c.banco === "AVAL"
            ? String(c.nit)
            : String(c.codigo_convenio),
        nombre: c.nombre_convenio,
      }));

      memory[ctx.from] = {
        texto: datos.sugerencia!,
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

    if (respuesta === "NO") {

      delete memory[ctx.from];

      await flowDynamic(
        "✍️ Escribe nuevamente el nombre del convenio."
      );

      return;
    }

    await flowDynamic("❌ Responde SI o NO.");

  }
);