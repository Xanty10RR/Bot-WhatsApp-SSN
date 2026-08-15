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

// Función reutilizable con fetch directo a Meta API para enviar botones interactivos
const mostrarMenu = async (ctx: any, texto?: string, customButtons?: { id: string; title: string }[]) => {
  const token = process.env.jwtToken;
  const numberId = process.env.numberId;

  if (!token || !numberId) {
    console.error("❌ Faltan las variables jwtToken o numberId en el .env");
    return;
  }

  const payloadBotones = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: ctx.from,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: texto || "Elige una opción para continuar."
      },
      action: {
        buttons: (customButtons || [
          { id: "btn_buscar", title: "🔄 Buscar" },
          { id: "btn_menu", title: "🏠 Menú" },
          { id: "btn_soporte", title: "📞 Soporte" }
        ]).slice(0,3).map(b => ({ type: "reply", reply: { id: b.id, title: b.title } }))
      }
    }
  };

  try {
    const url = `https://graph.facebook.com/v20.0/${numberId}/messages`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payloadBotones)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ Error de Meta API:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ Error enviando botones:", error);
  }
};

export const sugerenciaFlow = addKeyword(EVENTS.ACTION)
  .addAction(async (ctx, { state }) => {
    const myState = state.getMyState();
    const texto = `❌ No encontré coincidencias para:\n\n"${myState.textoOriginal}"\n\n🤔 ¿Quisiste decir?\n\n📋 *${myState.sugerenciaTexto}*\n\n✅ Presiona *SI* para consultar este convenio.\n\n🔄 O presiona *OTRO NOMBRE* para realizar una nueva búsqueda.`;
    await mostrarMenu(ctx, texto, [
      { id: "btn_si", title: "SI" },
      { id: "btn_otro", title: "OTRO NOMBRE" }
    ]);
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
          
          // 🚦 Pausa de 2 segundos para asegurar que la imagen llegue antes que los botones
          await new Promise((resolve) => setTimeout(resolve, 2000));
          
          await mostrarMenu(ctx);
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
      // Limpieza de tildes para que detecte correctamente "Menú" o "menu"
      const opcion = ctx.body.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      if (opcion === "buscar") return gotoFlow(submenu1Flow);
      if (opcion === "menu") return gotoFlow(mainFlow);
      if (opcion === "soporte") {
        await flowDynamic(`📞 *Soporte Técnico*\n📱 323493779\n🕗 L-S: 7:30am-02:00pm / 02:00pm-10:00pm`);
        return;
      }
      await flowDynamic("❌ Opción no válida.\n\nEscribe *buscar*, *menu* o *soporte*.");
  });