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

// Función para enviar los botones interactivos iniciales (SI / OTRO NOMBRE)
const mostrarMenuBotones = async (ctx: any, texto: string, botones: any[]) => {
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
      body: { text: texto },
      action: {
        buttons: botones.map(b => ({
          type: "reply",
          reply: { id: b.id, title: b.title }
        }))
      }
    }
  };

  try {
    const url = `https://graph.facebook.com/v20.0/${numberId}/messages`;
    await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payloadBotones)
    });
  } catch (error) {
    console.error("❌ Error enviando botones:", error);
  }
};

export const sugerenciaFlow = addKeyword(EVENTS.ACTION)
  .addAction(async (ctx, { state }) => {
    const myState = state.getMyState();
    const texto = `❌ No encontré coincidencias para:\n\n"${myState.textoOriginal}"\n\n🤔 ¿Quisiste decir?\n\n📋 *${myState.sugerenciaTexto}*\n\n✅ Presiona *SI* para consultar este convenio.\n\n🔄 O presiona *OTRO NOMBRE* para realizar una nueva búsqueda.`;
    
    await mostrarMenuBotones(ctx, texto, [
      { id: "btn_si", title: "SI" },
      { id: "btn_otro", title: "OTRO NOMBRE" }
    ]);
  })
  .addAnswer(
    "",
    { capture: true },
    async (ctx, { state, flowDynamic, gotoFlow }) => {
      const opcion = ctx.body.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const myState = state.getMyState();

      // Si acepta la sugerencia (SI, btn_si, o "1")
      if ((opcion === "si" || opcion === "btn_si" || opcion === "1") && myState.sugerenciaTexto) {
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
          
          await new Promise((resolve) => setTimeout(resolve, 2000));
          
          // Mostramos el menú de texto plano directamente aquí
          await flowDynamic(
            "Elige una opción para continuar:\n\n" +
            "1️⃣ 🔄 Buscar\n" +
            "2️⃣ 🏠 Menú\n" +
            "3️⃣ 📞 Soporte\n\n" +
            "✍️ *Escribe el número de tu opción (1, 2 o 3)*"
          );
          return; 
        }

        await state.update({ listaConvenios: coincidencias });
        return gotoFlow(seleccionarConvenioFlow);
      }

      // Si elige otro nombre
      if (opcion.includes("otro") || opcion === "btn_otro" || opcion === "2") {
        return gotoFlow(submenu1Flow);
      }

      return gotoFlow(submenu1Flow);
    }
  )
  .addAnswer(
    "", 
    { capture: true },
    async (ctx, { flowDynamic, gotoFlow }) => {
      const opcion = ctx.body.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      if (opcion === "1" || opcion === "buscar") return gotoFlow(submenu1Flow);
      if (opcion === "2" || opcion === "menu") return gotoFlow(mainFlow);
      if (opcion === "3" || opcion === "soporte") {
        await flowDynamic(`📞 *Soporte Técnico*\n📱 323493779\n🕗 L-S: 7:30am - 02:00pm / 02:00pm - 10:00pm`);
        return gotoFlow(mainFlow);
      }
      
      await flowDynamic("❌ Opción no válida.\n\nEscribe *1* (Buscar), *2* (Menú) o *3* (Soporte).");
    }
  );