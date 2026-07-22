import { addKeyword } from "@builderbot/bot";
import { MENU_IDS } from "../constants";
import { buscarFlow } from "./buscarFlow";

export const submenu1Flow = addKeyword(
    MENU_IDS.PRINCIPAL.OPCION1
).addAction(
    async (_, { gotoFlow }) => {

        return gotoFlow(buscarFlow);

    }
);