// templates/submenus/submenu1.ts
import { addKeyword } from "@builderbot/bot";
import { MENU_IDS } from "../constants";

export const submenu2Flow = addKeyword(MENU_IDS.PRINCIPAL.OPCION2)
    .addAnswer("Se te revelo el sistema?")
    .addAnswer("¿Qué tipo de ayuda quieres?",
        {
            capture: false
        },
        async (ctx, { provider }) => {
            const list = {
                header: { type: "text", text: "Consulta nuestras ofertas" },
                body: { text: "Elige una opción" },
                footer: { text: "Aqui" },
                action: {
                    button: "Opciones",
                    sections: [
                        {
                            title: "Saldo",
                            rows: [
                                {
                                    id: MENU_IDS.SUBMENU_2.OPCION1,
                                    title: "Lamar a los bomberos",
                                    description: "Pedir ayuda"
                                },
                                {
                                    id: MENU_IDS.SUBMENU_2.OPCION2,
                                    title: "Lamar a la policia",
                                    description: "Pedir ayuda"
                                }
                            ]
                        }
                    ]
                }
            };
            await provider.sendList(ctx.from, list);
        });
