/*import { addKeyword } from "@builderbot/bot";
import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { ConvenioService } from "../../services/convenio.service";
import { formatearConvenio } from "../../utils/formatearConvenio";
import { memory } from "./memory";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mostrarMenu = async (flowDynamic: any) => {
  await flowDynamic(`

━━━━━━━━━━━━━━

🔄 Escribe *buscar* para hacer otra consulta.

🏠 Escribe *menu* para volver al inicio.

📞 Escribe *soporte* para hablar con soporte.

━━━━━━━━━━━━━━
`);
};

export const seleccionarConvenioFlow = addKeyword("__SELECCIONAR__").addAnswer(
  "",
  {
    capture: true,
  },
  async (ctx, { flowDynamic }) => {

    const datos = memory[ctx.from];

    if (!datos) {
      await flowDynamic("⚠️ La búsqueda expiró.");
      return;
    }

    const lista = datos.resultados;

    const numero = Number(ctx.body);

    if (
      isNaN(numero) ||
      numero < 1 ||
      numero > lista.length
    ) {
      await flowDynamic("❌ Número inválido.");
      return;
    }

    const seleccionado = lista[numero - 1];

    const convenio = await ConvenioService.obtenerPorId(
      seleccionado.banco,
      seleccionado.id
    );

    if (!convenio) {
      await flowDynamic("❌ No pude encontrar el convenio.");
      return;
    }

    await flowDynamic(
      formatearConvenio(convenio)
    );

    // Buscar imagen del convenio
    const nit = convenio.nit;

    if (nit) {

      const extensiones = ["png", "jpg", "jpeg"];

      for (const ext of extensiones) {

        const imagePath = resolve(
          __dirname,
          "images",
          `${nit}.${ext}`
        );

        if (existsSync(imagePath)) {

          await flowDynamic([
            {
              body: "🖼️ Imagen del convenio",
              media: imagePath,
            },
          ]);

          break;
        }
      }
    }

    delete memory[ctx.from];

    await mostrarMenu(flowDynamic);

  }
);
*/