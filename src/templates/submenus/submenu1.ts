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

const mostrarMenu = async (ctx: any, provider?: any) => {
  const payloadBotones = {
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: "━━━━━━━━━━━━━━\n🔄 Elige una opción para continuar.\n━━━━━━━━━━━━━━"
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: "btn_buscar", // Meta exige un ID único interno
              title: "Buscar"     // El texto que ve el usuario (Máx 20 chars)
            }
          },
          {
            type: "reply",
            reply: {
              id: "btn_menu",
              title: "Menú"
            }
          },
          {
            type: "reply",
            reply: {
              id: "btn_soporte",
              title: "Soporte"
            }
          }
        ]
      }
    }
  };

  try {
    // Enviamos el payload nativo usando el provider de Meta
    // Si no se pasa el provider, intentamos obtenerlo desde ctx
    const prov = provider || ctx._client || ctx.client || ctx.provider;
    if (!prov || typeof prov.sendMessage !== "function") {
      console.error("No provider disponible para enviar botones");
      return;
    }
    await prov.sendMessage(ctx.from, ' ', payloadBotones);
  } catch (error) {
    console.error("Error enviando botones:", error);
  }
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
        await mostrarMenu(ctx); // provider se detecta desde ctx si está disponible
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