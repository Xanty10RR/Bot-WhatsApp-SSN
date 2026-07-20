import { ConvenioService } from "../../services/convenio.service";
import { formatearBusqueda } from "../../utils/formatearBusqueda";
import { addKeyword } from "@builderbot/bot";
import { MENU_IDS } from "../constants";

export const submenu1Flow = addKeyword(MENU_IDS.PRINCIPAL.OPCION1)
.addAnswer(
    "✍️ Escribe el nombre del convenio, NIT, empresa o sigla.",
    {
        capture: true,
    },
    async (ctx, { flowDynamic }) => {

        const texto = ctx.body.trim();

        const resultado = await ConvenioService.buscar(texto);

        const respuesta = formatearBusqueda(texto, resultado);

        await flowDynamic(respuesta);

    }
);