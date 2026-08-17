import { addKeyword, EVENTS } from "@builderbot/bot";
import { formatearConvenio } from "../../utils/formatearConvenio";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { submenu1Flow } from "./submenu1";
import { mainFlow } from "../mainFlow";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Función reutilizable con fetch directo a Meta API para enviar botones interactivos
const mostrarMenu = async (ctx: any) => {
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
        text: "Elige una opción para continuar."
      },
      action: {
        buttons: [
          { type: "reply", reply: { id: "btn_buscar", title: "🔄 Buscar" } },
          { type: "reply", reply: { id: "btn_menu", title: "🏠 Menú" } },
          { type: "reply", reply: { id: "btn_soporte", title: "📞 Soporte" } }
        ]
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

export const seleccionarConvenioFlow = addKeyword(EVENTS.ACTION)
  .addAction(async (ctx, { state, flowDynamic }) => {
    const myState = state.getMyState();
    const coincidencias: { nombre_convenio: string; banco: string; codigo_convenio?: string }[] = myState.listaConvenios || [];

    let mensaje = `🔎 Encontré *${coincidencias.length}* coincidencias:\n\n`;
    coincidencias.forEach((item: { nombre_convenio: string; banco: string }, index: number) => {
      mensaje += `*${index + 1}.* ${item.nombre_convenio}\n🏦 ${item.banco}\n\n`;
    });
    mensaje += "✍️ Escribe el número del convenio que deseas seleccionar.";
    
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
      
      // 🚦 Pausa de 2 segundos para asegurar que la imagen llegue antes que los botones
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      await mostrarMenu(ctx);
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