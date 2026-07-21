import { ConvenioService } from "../../services/convenio.service";
import { formatearBusqueda } from "../../utils/formatearBusqueda";
import { addKeyword } from "@builderbot/bot";
import { MENU_IDS } from "../constants";
import { formatearConvenio } from "../../utils/formatearConvenio";

// Simple in-memory storage for search results per user (phone or id)
const memory: Record<string, any[]> = {};

export const submenu1Flow = addKeyword(MENU_IDS.PRINCIPAL.OPCION1)

.addAnswer(
    "✍️ Escribe el nombre del convenio, NIT, empresa o sigla.",
    {
        capture: true,
    },
    async (ctx, { flowDynamic }) => {

        const texto = ctx.body.trim();

        const resultado = await ConvenioService.buscar(texto);

        const coincidencias = [
            ...resultado.bbva,
            ...resultado.agrario,
            ...resultado.aval,
        ];

        if (coincidencias.length === 0) {
            await flowDynamic("❌ No encontré coincidencias.");
            return;
        }

        if (coincidencias.length === 1) {
            await flowDynamic(
                formatearBusqueda(texto, resultado)
            );
            return;
        }

        // Guardamos resultados
        memory[ctx.from] = coincidencias;

        let mensaje =
            `🔎 Encontré *${coincidencias.length}* coincidencias.\n\n`;

        coincidencias.forEach((item, index) => {

            mensaje += `${index + 1}️⃣ ${item.nombre_convenio}\n`;
            mensaje += `🏦 ${item.banco}\n\n`;

        });

        mensaje += "✍️ Escribe el número del convenio.";

        await flowDynamic(mensaje);

    }
)

.addAnswer(
    "",
    {
        capture: true,
    },
    async (ctx, { flowDynamic }) => {

        const lista = memory[ctx.from];

        if (!lista) {
            await flowDynamic("⚠️ La búsqueda expiró.");
            return;
        }

        const numero = parseInt(ctx.body);

        if (
            isNaN(numero) ||
            numero < 1 ||
            numero > lista.length
        ) {
            await flowDynamic("❌ Número inválido.");
            return;
        }

        const convenio = lista[numero - 1];

        const respuesta = formatearConvenio(convenio);

        await flowDynamic(respuesta);

    }
);