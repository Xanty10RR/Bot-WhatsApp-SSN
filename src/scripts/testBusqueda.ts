import { ConvenioService } from "../services/convenio.service";

async function main() {
    const resultados = await ConvenioService.buscar("COMCEL");

    console.log(JSON.stringify(resultados, null, 2));
}

main().catch(console.error);