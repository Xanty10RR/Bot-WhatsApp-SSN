import { addKeyword, EVENTS } from "@builderbot/bot";
import { formatearConvenio } from "../../utils/formatearConvenio";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { submenu1Flow } from "./submenu1";
import { mainFlow } from "../mainFlow";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mostrarMenu = async (flowDynamic: any) => {
  await flowDynamic(`━━━━━━━━━━━━━━\n🔄 Escribe *buscar* para hacer otra consulta.\n🏠 Escribe *menu* para volver al inicio.\n📞 Escribe *soporte* para hablar con soporte.\n━━━━━━━━━━━━━━`);
};

export const seleccionarConvenioFlow = addKeyword(EVENTS.ACTION)
  .addAction(async (ctx, { state, flowDynamic }) => {
    const myState = state.getMyState();
    const coincidencias: { nombre_convenio: string; banco: string; codigo_convenio?: string }[] = myState.listaConvenios || [];

    let mensaje = `🔎 Encontré *${coincidencias.length}* coincidencias.\n\n`;
    coincidencias.forEach((item: { nombre_convenio: string; banco: string }, index: number) => {
      mensaje += `${index + 1}️⃣ ${item.nombre_convenio}\n🏦 ${item.banco}\n\n`;
    });
    mensaje += "✍️ Escribe el número del convenio.";
    
    await flowDynamic(mensaje);
  })
  .addAnswer(
    "", // El texto ya se mandó en el addAction
    { capture: true },
    async (ctx, { state, flowDynamic, fallBack }) => {
      const myState = state.getMyState();
      const coincidencias = myState.listaConvenios || [];
      const numero = parseInt(ctx.body.trim());

      // Validación a prueba de fallos
      if (isNaN(numero) || numero < 1 || numero > coincidencias.length) {
        return fallBack("❌ Número inválido. Por favor, escribe un número de la lista.");
      }

      const convenio = coincidencias[numero - 1];
      await flowDynamic(formatearConvenio(convenio));

      const rutaImagen = resolve(__dirname, "images", `${convenio.codigo_convenio}.png`);
      if (existsSync(rutaImagen)) {
        await flowDynamic([{ body: "📷 *Instructivo para realizar el recaudo.*", media: rutaImagen }]);
      }

      await state.update({ listaConvenios: null }); // Limpiamos la memoria
      await mostrarMenu(flowDynamic);
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