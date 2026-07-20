import { ConvenioService } from "../../services/convenio.service";
import { formatearBusqueda } from "../../utils/formatearBusqueda";
import { addKeyword } from "@builderbot/bot";
import { MENU_IDS } from "../constants";
import { mainFlow } from "../mainFlow";

const mostrarMenuOpciones = async (flowDynamic: any) => {
  await flowDynamic([
    {
      body: "✨ ¿Qué te gustaría hacer ahora? 👇",
      buttons: [
        { body: "🔄 Nueva Búsqueda" },
        { body: "📞 Soporte" },
        { body: "🔙 Menú Principal" },
      ],
      delay: 2000,
    },
  ]);
};

const handleOptions = async (ctx: any, { flowDynamic, gotoFlow, state }: any) => {
  const body = ctx.body?.trim();

  if (body?.includes("Nueva Búsqueda") || body?.includes("🔄")) {
    await state.clear();
    return gotoFlow(submenu1Flow);
  }

  if (ctx.body.includes("Soporte") || ctx.body.includes("📞")) {
    await flowDynamic([
      "📞 Soporte Técnico",
      "Número: 323493779 \n🔹 Lunes a Viernes\n⏰ 8:00 a.m. - 12:00 p.m. | 2:00 p.m. - 6:00 p.m. ",
    ]);
    return gotoFlow(mainFlow);
  }

  if (body?.includes("Menú Principal") || body?.includes("🔙")) {
    return gotoFlow(mainFlow);
  }

  await flowDynamic("❌ Opción no válida.");
  return gotoFlow(mainFlow);
};
export const buscarConvenioFlow = addKeyword([
  "consultar convenio",
  "buscar convenio",
  "convenio",
]);

export const submenu1Flow = addKeyword(MENU_IDS.PRINCIPAL.OPCION1)
  .addAnswer(
    "✍️ Escribe el nombre del convenio, NIT, empresa o sigla.",
    {
      capture: true,
    },
    async (ctx, { flowDynamic, gotoFlow }) => {
      const texto = ctx.body.trim();

      const resultado = await ConvenioService.buscar(texto);

      const respuesta = formatearBusqueda(texto, resultado);

      await flowDynamic(respuesta);

      return gotoFlow(mainFlow);
    },
  )

  // 👉 Capturar respuesta del botón
  .addAction({ capture: true }, handleOptions)
  .addAction({ capture: true }, async (ctx, { gotoFlow, flowDynamic }) => {
    if (ctx.body.includes("Nueva Búsqueda") || ctx.body.includes("🔄")) {
      return gotoFlow(submenu1Flow);
    }
    if (ctx.body.includes("Soporte") || ctx.body.includes("📞")) {
      await flowDynamic([
        "📞 Soporte Técnico",
        "Número: 323493779 \n🔹 Lunes a Viernes\n⏰ 8:00 a.m. - 12:00 p.m. | 2:00 p.m. - 6:00 p.m. ",
      ]);
    }
    if (ctx.body.includes("Menú Principal") || ctx.body.includes("🔙")) {
      return gotoFlow(mainFlow);
    }
    await flowDynamic("❌ Opción no válida. Por favor elige un botón.");
    return gotoFlow(mainFlow);
  })

  .addAction({ capture: true }, handleOptions);
