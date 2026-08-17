import { addKeyword, EVENTS } from "@builderbot/bot";
import { formatearConvenio } from "../../utils/formatearConvenio";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { submenu1Flow } from "./submenu1";
import { mainFlow } from "../mainFlow";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    async (ctx, { state, flowDynamic, fallBack, gotoFlow }) => {
      const myState = state.getMyState();
      const coincidencias = myState.listaConvenios || [];
      const textoIngresado = ctx.body.trim();
      const numero = parseInt(textoIngresado);

      // Validación a prueba de fallos para seleccionar el convenio de la lista
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
      
      // 🚦 Pausa de 2 segundos para asegurar que la imagen llegue antes que el menú
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Enviamos el menú de texto plano solicitado
      await flowDynamic(
        "Elige una opción para continuar:\n\n" +
        "1️⃣ 🔄 Buscar\n" +
        "2️⃣ 🏠 Menú\n" +
        "3️⃣ 📞 Soporte\n\n" +
        "✍️ *Escribe el número de tu opción (1, 2 o 3)*"
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