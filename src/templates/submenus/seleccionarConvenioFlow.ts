import { addKeyword } from "@builderbot/bot";
import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import { MENU_IDS } from "../constants";
import { memory } from "./memory";
import { formatearConvenio } from "../../utils/formatearConvenio";

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

export const seleccionarConvenioFlow =
addKeyword("__SELECCIONAR__")

.addAnswer(
"",
{
    capture:true
},
async (ctx,{flowDynamic})=>{

    const datos = memory[ctx.from];

    if(!datos){
        await flowDynamic("⚠️ La búsqueda expiró.");
        return;
    }

    const lista = datos.coincidencias;

    // Primera vez que entra al flujo:
    // mostrar lista y esperar el número
    if(ctx.body === "__SELECCIONAR__"){

        let mensaje=`🔎 Encontré *${lista.length}* coincidencias.\n\n`;

        lista.forEach((item,index)=>{

            mensaje+=`${index+1}️⃣ ${item.nombre_convenio}\n`;
            mensaje+=`🏦 ${item.banco}\n\n`;

        });

        mensaje+="✍️ Escribe el número del convenio.";

        await flowDynamic(mensaje);

        return;
    }

    const numero=parseInt(ctx.body);

    if(
        isNaN(numero) ||
        numero<1 ||
        numero>lista.length
    ){
        await flowDynamic("❌ Número inválido.");
        return;
    }

    const convenio=lista[numero-1];

    await flowDynamic(
        formatearConvenio(convenio)
    );

    const nit=convenio.nit;

    const extensiones=["png","jpg","jpeg"];

    for(const ext of extensiones){

        const imagePath=
        resolve(__dirname,"images",`${nit}.${ext}`);

        if(existsSync(imagePath)){

            await flowDynamic([
                {
                    body:"🖼️ Imagen del convenio",
                    media:imagePath
                }
            ]);

            break;
        }

    }

    delete memory[ctx.from];

    await mostrarMenu(flowDynamic);

});