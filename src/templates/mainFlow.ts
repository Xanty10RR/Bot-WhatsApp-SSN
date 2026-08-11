import { addKeyword, EVENTS} from "@builderbot/bot";
import { provider } from "~/provider";
import { text } from "stream/consumers";
import { MENU_IDS } from "./constants";


const mainFlow = addKeyword(['inicio','menu',EVENTS.WELCOME])
    .addAnswer (
        '',
        {
            capture: false
        },
    async (ctx, { provider }) => {
        const list = {
            header: { type: "text", text: "*¡Hola! 👋, Bienvenido al Asistente de SuperGiros* 🔵⚪\n\n" },
            body: { text: "Estoy aquí las 24h para brindarte una mejor experiencia y ayudarte a consultar *códigos de convenios*, *instrucciones de pago sobre facturas de convenios* y *hacer requisiciones* de forma rápida." },
            footer: { text: "¿Que deseas hacer hoy?, por favor selecciona una opción:" },
            action: {
                button: "Lista de opciones",
                sections: [
                    {
                        title: "Ayuda",
                        rows: [
                            {
                                id: MENU_IDS.PRINCIPAL.OPCION1,
                                title: "🔍 Consultar un convenio",
                                description: "Solicita información de convenio, instrucciones de pago"
                            },
                            {
                                id: MENU_IDS.PRINCIPAL.OPCION3,
                                title: "📋 Proceso de requisición",
                                description: "Solicita activos, insumos, repuestos, servicios..."
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