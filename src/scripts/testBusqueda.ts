import { ConvenioService } from "../services/convenio.service";
import { formatearBusqueda } from "../utils/formatearBusqueda";

async function main() {

    const texto = "COMCEL";

    const resultado = await ConvenioService.buscar(texto);

    const mensaje = formatearBusqueda(texto, resultado);

    console.log(mensaje);

}

main().catch(console.error);