import { addKeyword } from "@builderbot/bot";
import { MENU_IDS } from "../constants";

export const submenu3Flow = addKeyword(MENU_IDS.PRINCIPAL.OPCION3)
    .addAnswer("Este proceso pertenece a logística", { capture: false })
    .addAction(async (ctx, { provider }) => {
        const list = {
            header: { 
                type: "text", 
                text: "Gestión de requisiciones" 
            },
            body: { 
                text: "Selecciona la acción que deseas realizar:" 
            },
            footer: { 
                text: "Equipo de Logística" 
            },
            action: {
                button: "Opciones",
                sections: [
                    { 
                        title: "Requisiciones",
                        rows: [
                            {
                                id: MENU_IDS.SUBMENU_3.OPCION1, // Asegúrate que existe
                                title: "Solicitar requisición",
                                description: "Crear nueva solicitud"
                            },
                            {
                                id: MENU_IDS.SUBMENU_3.OPCION2,
                                title: "Aprobar requisición",
                                description: "Revisar solicitudes"
                            }
                        ]
                    }
                ]
            }
        };

        try {
            await provider.sendList(ctx.from, list);
        } catch (error) {
            console.error("Error al enviar lista:", error);
            // Fallback a mensajes simples si falla la lista
            await provider.sendText(ctx.from, "Por favor elige una opción:");
            await provider.sendText(ctx.from, "1. Solicitar requisición");
            await provider.sendText(ctx.from, "2. Aprobar requisición");
        }
    });