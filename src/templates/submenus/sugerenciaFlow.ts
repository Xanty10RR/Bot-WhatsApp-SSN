import { addKeyword, EVENTS } from "@builderbot/bot";
import { ConvenioService } from "../../services/convenio.service";
import { submenu1Flow } from "./submenu1";
import { seleccionarConvenioFlow } from "./seleccionarConvenioFlow";
import { formatearConvenio } from "../../utils/formatearConvenio";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { mainFlow } from "../mainFlow";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mostrarMenu = async (flowDynamic: any) => {
  await flowDynamic(`━━━━━━━━━━━━━━\n🔄 Escribe *buscar* para hacer otra consulta.\n🏠 Escribe *menu* para volver al inicio.\n📞 Escribe *soporte* para hablar con soporte.\n━━━━━━━━━━━━━━`);
};

export const sugerenciaFlow = addKeyword(EVENTS.ACTION)
  .addAction(async (ctx, { state, flowDynamic }) => {
    const myState = state.getMyState();
    await flowDynamic(`❌ No encontré coincidencias para:\n\n"${myState.textoOriginal}"\n\n🤔 ¿Quisiste decir?\n\n📋 *${myState.sugerenciaTexto}*\n\n✅ Escribe *SI* para consultar este convenio.\n\n🔄 O escribe *OTRO NOMBRE* para realizar una nueva búsqueda.`);
  })
  .addAnswer(
    "",
    { capture: true },
    async (ctx, { state, flowDynamic, gotoFlow }) => {
      const opcion = ctx.body.trim().toLowerCase();
      const myState = state.getMyState();

      if (opcion === "si" && myState.sugerenciaTexto) {
        const texto = myState.sugerenciaTexto;
        const resultado = await ConvenioService.buscar(texto);
        const coincidencias = [...resultado.bbva, ...resultado.agrario, ...resultado.aval];

        await state.update({ sugerenciaTexto: null, textoOriginal: null });

        if (coincidencias.length === 1) {
          const convenio = coincidencias[0];
          await flowDynamic(formatearConvenio(convenio));
          const rutaImagen = resolve(__dirname, "images", `${convenio.codigo_convenio}.png`);
          if (existsSync(rutaImagen)) {
            await flowDynamic([{ body: "📷 *Instructivo para realizar el recaudo.*", media: rutaImagen }]);
          }
          await mostrarMenu(flowDynamic);
          return;
        }

        await state.update({ listaConvenios: coincidencias });
        return gotoFlow(seleccionarConvenioFlow);
      }

      // Si escribe cualquier otra cosa, lo mandamos a buscar de nuevo con esa nueva palabra
      return gotoFlow(submenu1Flow); 
    }
  )
  .addAction({ capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
      const opcion = ctx.body.trim().toLowerCase();
      if (opcion === "buscar") return gotoFlow(submenu1Flow);
      if (opcion === "menu") return gotoFlow(mainFlow);
      if (opcion === "soporte") {
        await flowDynamic(`📞 *Soporte Técnico*\n📱 323493779\n🕗 L-V: 7:00am-12:00pm / 12:00pm-6:00pm`);
        return;
      }
      await flowDynamic("❌ Opción no válida.\n\nEscribe *buscar*, *menu* o *soporte*.");
  });