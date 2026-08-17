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
        await mostrarMenu(ctx);
        return; 
      }

      // CASO 3: Hay varios
      await state.update({ listaConvenios: coincidencias });
      return gotoFlow(seleccionarConvenioFlow);
    }
  )
  .addAction({ capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
      const opcion = ctx.body.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      if (opcion === "buscar") return gotoFlow(submenu1Flow);
      if (opcion === "menu") return gotoFlow(mainFlow);
      if (opcion === "soporte") {
        await flowDynamic(`📞 *Soporte Técnico*\n📱 323493779\n🕗 L-S: 7:30am-02:00pm / 02:00pm-10:00pm`);
        return;
      }
      await flowDynamic("❌ Opción no válida.\n\nEscribe *buscar*, *menu* o *soporte*.");
  });