import { addKeyword, EVENTS } from "@builderbot/bot";
import { formatearConvenio } from "../../utils/formatearConvenio";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { submenu1Flow } from "./submenu1";
import { mainFlow } from "../mainFlow";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const seleccionarConvenioFlow: any = addKeyword(EVENTS.ACTION)
  .addAction(async (ctx, { state, flowDynamic }) => {
    const myState = state.getMyState();
    
    // Si viene de una búsqueda nueva, guardamos toda la lista y ponemos la página en 0
    const listaCompleta = myState.listaConveniosOriginal || myState.listaConvenios || [];
    const pagina = myState.paginaConvenios || 0;
    const porPagina = 50; // 50 convenios por página para evitar que el mensaje sea gigante y cause error 400

    const inicio = pagina * porPagina;
    const fin = inicio + porPagina;
    const sliceConvenios = listaCompleta.slice(inicio, fin);

    let mensaje = `🔎 Encontré *${listaCompleta.length} coincidencias en total* (_Página_ _${pagina + 1}_ _de_ _${Math.ceil(listaCompleta.length / porPagina)}_):\n\n`;
    
    sliceConvenios.forEach((item: any, index: number) => {
      // El número real en la lista global (ej: 1, 2... o 11, 12...)
      const numeroReal = inicio + index + 1;
      mensaje += `*${numeroReal}.* ${item.nombre_convenio}\n🏦 ${item.banco}\n\n`;
    });

    mensaje += "✍️ Escribe el número del convenio que deseas seleccionar.";
    
    if (fin < listaCompleta.length) {
      mensaje += "\n\n➡️ Escribe *MAS* para ver los siguientes resultados.";
    }

    // Actualizamos el estado guardando la lista original intacta y la página
    await state.update({ 
      listaConveniosOriginal: listaCompleta,
      listaConvenios: sliceConvenios, // Los que están activos para seleccionar en esta página
      paginaConvenios: pagina 
    });

    await flowDynamic(mensaje);
  })
  .addAnswer(
    "", 
    { capture: true },
    async (ctx, { state, flowDynamic, fallBack, gotoFlow }) => {
      const myState = state.getMyState();
      const textoIngresado = ctx.body.trim().toLowerCase();

      // Si el usuario escribe "mas" y hay más páginas
      if (textoIngresado === "mas" || textoIngresado === "más") {
        const listaCompleta = myState.listaCompletaConvenios || myState.listaConveniosOriginal || [];
        const pagina = (myState.paginaConvenios || 0) + 1;
        const porPagina = 50;

        if (pagina * porPagina < listaCompleta.length) {
          await state.update({ paginaConvenios: pagina, listaConvenios: listaCompleta });
          return gotoFlow(seleccionarConvenioFlow);
        } else {
          await flowDynamic("⚠️ No hay más resultados en la lista.");
          return;
        }
      }

      const numero = parseInt(textoIngresado);
      const coincidenciasActivas = myState.listaConvenios || [];

      if (isNaN(numero) || numero < 1) {
        return fallBack("❌ Número inválido. Por favor, escribe un número de la lista o escribe *MAS*.");
      }

      // Buscamos en la lista completa el índice exacto
      const listaCompleta = myState.listaConveniosOriginal || coincidenciasActivas;
      const convenio = listaCompleta[numero - 1];

      if (!convenio) {
        return fallBack("❌ El número seleccionado no está en el rango de la lista. Por favor, escribe un *número válido que se encuentre dentro de la lista* para continuar.");
      }

      await flowDynamic(formatearConvenio(convenio));

      const rutaImagen = resolve(__dirname, "images", `${convenio.codigo_convenio}.webp`);
      if (existsSync(rutaImagen)) {
        await flowDynamic([{ body: "📷 *Instructivo para realizar el recaudo.*", media: rutaImagen }]);
      }

      await state.update({ listaConvenios: null, listaConveniosOriginal: null, paginaConvenios: null });
      
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      await flowDynamic(
        "✍️ *Escribe el número de tu opción (1, 2 o 3)* para continuar:\n\n" +
        "1️⃣ 🔄 Buscar\n" +
        "2️⃣ 🏠 Menú\n" +
        "3️⃣ 📞 Soporte\n\n"
      );
    }
  )
  .addAnswer(
    "", 
    { capture: true }, 
    async (ctx, { flowDynamic, gotoFlow, fallBack }) => {
      const opcion = ctx.body.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      if (opcion === "1" || opcion === "buscar") return gotoFlow(submenu1Flow);
      if (opcion === "2" || opcion === "menu") return gotoFlow(mainFlow);
      if (opcion === "3" || opcion === "soporte") {
        await flowDynamic(`📞 *Soporte Técnico*\n📱 323493779\n🕗 L-S: 7:30am-02:00pm / 02:00pm-10:00pm`);
        return gotoFlow(mainFlow);
      }
      
      // Si no es 1, 2 o 3, uso fallBack para mostrar error y repetir el menú
      return fallBack(
        "❌ Opción no válida.\n\nPor favor, escribe solo el número:\n1️⃣ 🔄 Buscar\n2️⃣ 🏠 Menú\n3️⃣ 📞 Soporte"
      );
    }
  );