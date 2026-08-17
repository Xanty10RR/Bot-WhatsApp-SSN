import { ConvenioService } from "../../services/convenio.service";
import { addKeyword } from "@builderbot/bot";
import { MENU_IDS } from "../constants";
import { formatearConvenio } from "../../utils/formatearConvenio";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Importamos los flujos de apoyo
import { seleccionarConvenioFlow } from "./seleccionarConvenioFlow";
import { sugerenciaFlow } from "./sugerenciaFlow";
import { mainFlow } from "../mainFlow";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mostrarMenu = async (ctx: any, { flowDynamic }: { flowDynamic: any }) => {
  await flowDynamic(
    "Elige una opción para continuar:\n\n" +
    "1️⃣ 🔄 Buscar\n" +
    "2️⃣ 🏠 Menú\n" +
    "3️⃣ 📞 Soporte\n\n" +
    "✍️ *Escribe el número de tu opción (1, 2 o 3)*"
  );
};

export const submenu1Flow = addKeyword(MENU_IDS.PRINCIPAL.OPCION1)
  .addAnswer(
    "✍️ Escribe el NIT, nombre, empresa o sigla del convenio que deseas consultar.",
    { capture: true },
    // 🛠️ Quitamos el 'provider' que ya no se usa aquí
    async (ctx, { flowDynamic, gotoFlow, state }) => {
      const texto = ctx.body.trim();
      const resultado = await ConvenioService.buscar(texto);
      
      const coincidencias = [
        ...resultado.bbva,
        ...resultado.agrario,
        ...resultado.aval,
      ];

      // CASO 1: No hay nada -> Vamos a la sugerencia
      if (coincidencias.length === 0) {
        const sugerencia = await ConvenioService.sugerir(texto);

        if (sugerencia && sugerencia.score >= 0.35) {
          await state.update({ sugerenciaTexto: sugerencia.nombre_convenio, textoOriginal: texto });
          return gotoFlow(sugerenciaFlow);
        }

        await flowDynamic("❌ No encontré coincidencias.");
        return gotoFlow(mainFlow);
      }

      // CASO 2: Hay exactamente 1 -> Lo mostramos directo
      if (coincidencias.length === 1) {
        const convenio = coincidencias[0];
        await flowDynamic(formatearConvenio(convenio));

        const rutaImagen = resolve(__dirname, "images", `${convenio.codigo_convenio}.png`);
        if (existsSync(rutaImagen)) {
          await flowDynamic([
            {
              body: "📷 *Instructivo para realizar el recaudo de este convenio.*",
              media: rutaImagen,
            },
          ]);
        }
        
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return; 
      }

      // CASO 3: Hay varios
      await state.update({ listaConvenios: coincidencias });
      return gotoFlow(seleccionarConvenioFlow);
    }
  )
  .addAction(async (ctx, { flowDynamic, gotoFlow }) => {
      const opcion = ctx.body.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      if (opcion === "buscar") return gotoFlow(submenu1Flow);
      if (opcion === "menu") return gotoFlow(mainFlow);
      if (opcion === "soporte") {
        await flowDynamic(`📞 *Soporte Técnico*\n📱 323493779\n🕗 L-S: 7:30am-02:00pm / 02:00pm-10:00pm`);
        return;
      }
      await flowDynamic("❌ Opción no válida.\n\nEscribe *buscar*, *menu* o *soporte*.");
  });