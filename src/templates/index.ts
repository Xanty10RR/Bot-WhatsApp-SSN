import { createFlow } from "@builderbot/bot";

// Importa el flujo principal
import { mainFlow } from "./mainFlow";

// Importa submenús
import { seleccionarConvenioFlow } from "./submenus/seleccionarConvenioFlow";
import { sugerenciaFlow } from "./submenus/sugerenciaFlow";
import { submenu1Flow } from "./submenus/submenu1";
import { submenu2Flow } from "./submenus/submenu2";
import { submenu3Flow } from "./submenus/submenu3";

// Importa sub-submenús, se pueden agregar más sub-submenús aquí
import { RequisicionSolicitud } from "./submenus/submenu3.1";
import { VerificarIdentidad } from "./submenus/submenu3.2";

export default createFlow([
    // Primero los más específicos (sub-submenús)
    RequisicionSolicitud,
    VerificarIdentidad,

    // Luego los submenús
    seleccionarConvenioFlow,
    sugerenciaFlow,
    submenu1Flow,
    submenu2Flow,
    submenu3Flow,

    // Final del flujo principal
    mainFlow
]);