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

const mostrarMenu = async (flowDynamic: any) => {
  await flowDynamic(`━━━━━━━━━━━━━━
🔄 Escribe *buscar* para hacer otra consulta.
🏠 Escribe *menu* para volver al inicio.
📞 Escribe *soporte* para hablar con soporte.
━━━━━━━━━━━━━━`);
};

export const submenu1Flow = addKeyword(MENU_IDS.PRINCIPAL.OPCION1)
  .addAnswer(
    "✍️ Escribe el nombre del convenio, NIT, empresa o sigla.",
    { capture: true },
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
          // Guardamos la sugerencia en el estado del usuario de forma segura
          await state.update({ sugerenciaTexto: sugerencia.nombre_convenio, textoOriginal: texto });
          return gotoFlow(sugerenciaFlow);
        }

        await flowDynamic("❌ No encontré coincidencias.");
        return gotoFlow(mainFlow); // O lo devuelves a donde prefieras
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
        await mostrarMenu(flowDynamic);
        return; 
      }

      // CASO 3: Hay varios -> Guardamos la lista en el estado y vamos al selector
      await state.update({ listaConvenios: coincidencias });
      return gotoFlow(seleccionarConvenioFlow);
    }
  )
  // Manejo de la navegación post-resultado (si era solo 1)
  .addAction({ capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
      const opcion = ctx.body.trim().toLowerCase();

      if (opcion === "buscar") return gotoFlow(submenu1Flow);
      if (opcion === "menu") return gotoFlow(mainFlow);
      if (opcion === "soporte") {
        await flowDynamic(`📞 *Soporte Técnico*\n📱 323493779\n🕗 L-S: 7:30am-02:00pm / 02:00pm-10:00pm`);
        return;
      }
      await flowDynamic("❌ Opción no válida.\n\nEscribe *buscar*, *menu* o *soporte*.");
  });