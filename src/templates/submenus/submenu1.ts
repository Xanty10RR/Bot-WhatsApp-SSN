import { ConvenioService } from "../../services/convenio.service";
import { addKeyword } from "@builderbot/bot";
import { MENU_IDS } from "../constants";
import { formatearConvenio } from "../../utils/formatearConvenio";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { seleccionarConvenioFlow } from "./seleccionarConvenioFlow";
import { sugerenciaFlow } from "./sugerenciaFlow";
import { mainFlow } from "../mainFlow";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const submenu1Flow = addKeyword(MENU_IDS.PRINCIPAL.OPCION1)
  .addAnswer(
    "✍️ Escribe el NIT, nombre, empresa o sigla del convenio que deseas consultar.",
    { capture: true },
    async (ctx, { flowDynamic, gotoFlow, state }) => {
      const texto = ctx.body.trim();
      const resultado = await ConvenioService.buscar(texto);

      const coincidencias = [
        ...resultado.bbva,
        ...resultado.agrario,
        ...resultado.aval,
      ];

      // CASO 1: No hay nada
      if (coincidencias.length === 0) {
        const sugerencia = await ConvenioService.sugerir(texto);

        if (sugerencia && sugerencia.score >= 0.35) {
          await state.update({
            sugerenciaTexto: sugerencia.nombre_convenio,
            textoOriginal: texto,
          });
          return gotoFlow(sugerenciaFlow);
        }

        await flowDynamic("❌ No encontré coincidencias.");
        return gotoFlow(mainFlow);
      }

      // CASO 2: Hay exactamente 1
      if (coincidencias.length === 1) {
        const convenio = coincidencias[0];
        await flowDynamic(formatearConvenio(convenio));

        const rutaImagen = resolve(
          __dirname,
          "images",
          `${convenio.codigo_convenio}.png`,
        );
        if (existsSync(rutaImagen)) {
          await flowDynamic([
            {
              body: "📷 *Instructivo para realizar el recaudo de este convenio.*",
              media: rutaImagen,
            },
          ]);
        }

        // Esperamos 2 segundos y mostramos el menú de opciones de texto plano
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await flowDynamic(
          "✍️ *Escribe el número de tu opción (1, 2 o 3)* para continuar:\n\n" +
            "1️⃣ 🔄 Buscar\n" +
            "2️⃣ 🏠 Menú\n" +
            "3️⃣ 📞 Soporte\n\n"
        );
        return;
      }

      // CASO 3: Hay varias coincidencias
      await state.update({ listaConvenios: coincidencias });
      return gotoFlow(seleccionarConvenioFlow);
    },
  )
  .addAnswer("", { capture: true }, async (ctx, { flowDynamic, gotoFlow, fallBack }) => {
    const opcion = ctx.body
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (opcion === "1" || opcion === "buscar") return gotoFlow(submenu1Flow);
    if (opcion === "2" || opcion === "menu") return gotoFlow(mainFlow);
    if (opcion === "3" || opcion === "soporte") {
      await flowDynamic(
        `📞 *Soporte Técnico*\n📱 323493779\n🕗 L-S: 7:30am - 02:00pm / 02:00pm - 10:00pm`,
      );
      return gotoFlow(mainFlow);
    }

    // Si no es 1, 2 o 3, uso fallBack para mostrar error y repetir el menú
      return fallBack(
        "❌ Opción no válida.\n\nPor favor, escribe solo el número:\n1️⃣ 🔄 Buscar\n2️⃣ 🏠 Menú\n3️⃣ 📞 Soporte"
      );
  }
);