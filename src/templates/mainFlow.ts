import { addKeyword, EVENTS } from "@builderbot/bot";
import { MENU_IDS } from "./constants";

const mainFlow = addKeyword(['inicio', 'menu', EVENTS.WELCOME])
    .addAnswer('') 
    .addAction(async (ctx, { provider }) => {
        
        // Estructura limpia y validada para los servidores de Meta
        const list = {
            header: { 
                type: "text", 
                text: "Soy el Asistente de SuperGiros"
            },
            body: { 
                text: "¡Hola! 👋 Estoy aquí las 24h para brindarte una mejor experiencia y ayudarte a consultar *códigos de convenios* y hacer *requisiciones* de forma rápida.\n¿Qué deseas hacer hoy?, selecciona una opción" 
            },
            footer: { 
                text: "SUPERSERVICIOS DE NARIÑO S.A" 
            },
            action: {
                button: "Ver opciones", // ⚠️ Máximo 20 caracteres 
                sections: [
                    {
                        title: "Ayuda y Servicios",
                        rows: [
                            {
                                id: MENU_IDS.PRINCIPAL.OPCION1,
                                title: "🔍 Consultar convenio", // ⚠️ Máximo 24 caracteres
                                description: "Solicita información de convenio, instrucciones de pago" // ⚠️ Máximo 72 caracteres
                            },
                            {
                                id: MENU_IDS.PRINCIPAL.OPCION3,
                                title: "📋 Hacer requisición",
                                description: "Solicita activos, insumos, repuestos, servicios..."
                            }
                        ]
                    }
                ]
            }
        };

        try {
            await provider.sendList(ctx.from, list);
        } catch (error) {
            console.error("Error al enviar la lista:", error);
        }
    });

export { mainFlow };