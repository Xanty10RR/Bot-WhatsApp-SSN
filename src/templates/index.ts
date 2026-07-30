// templates/index.ts

import { createFlow } from "@builderbot/bot";

// Importa el flujo principal
import { mainFlow } from "./mainFlow";

// Importa submenús
import { seleccionarConvenioFlow } from "./submenus/seleccionarConvenioFlow";
import { sugerenciaFlow } from "./submenus/sugerenciaFlow";
import { submenu1Flow } from "./submenus/submenu1";
import { submenu2Flow } from "./submenus/submenu2";
import { submenu3Flow } from "./submenus/submenu3";

// Importa sub-submenús
import { RequisicionSolicitud } from "./submenus/submenu3.1";
import { VerificarIdentidad } from "./submenus/submenu3.2";
// Puedes agregar más sub-submenús aquí

export default createFlow([
    // 1. Primero los más específicos (sub-submenús)
    RequisicionSolicitud,
    VerificarIdentidad,

    // 2. Luego los submenús
    seleccionarConvenioFlow, // Añadido
    sugerenciaFlow,         // Añadido
    submenu1Flow,
    submenu2Flow,
    submenu3Flow,

    // 3. Al final el flujo principal
    mainFlow
]);