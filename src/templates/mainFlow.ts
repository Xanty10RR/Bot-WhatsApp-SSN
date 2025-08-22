import { addKeyword, EVENTS} from "@builderbot/bot";
import { provider } from "~/provider";
import { text } from "stream/consumers";
import { MENU_IDS } from "./constants";


const mainFlow = addKeyword(['inicio','menu',EVENTS.WELCOME])
    .addAnswer (
        '🌟 Hola, *¡Bienvenido a SuperGiros!* 🔵⚪\n',
        {
            capture: false
        },
    async (ctx, { provider }) => {
        const list = {
            header: { type: "text", text: "En que te podemos ayudar hoy" },
            body: { text: "👋" },
            footer: { text: "Por favor selecciona una opción:" },
            action: {
                button: "Lista de opciones",
                sections: [
                    {
                        title: "Ayuda",
                        rows: [
                            {
                                id: MENU_IDS.PRINCIPAL.OPCION1,
                                title: "📋 Consultar convenio",
                                description: "ℹ️ solicita informacion de convenio"
                            },
                            {
                                id: MENU_IDS.PRINCIPAL.OPCION3,
                                title: "Proceso de Requisicion",
                                description: "Presenta dificultades en el sistema"
                            }
                        ]
                    }
                ]
            }
        }
        await provider.sendList(ctx.from, list)
    }    
    )    
export {mainFlow};