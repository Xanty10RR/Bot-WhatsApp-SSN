import { addKeyword } from "@builderbot/bot";
import { MENU_IDS } from "../constants";
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { mainFlow } from '../mainFlow';
import { createReadStream } from 'fs';
import { existsSync } from 'fs';

const mostrarMenuOpciones = async (flowDynamic: any) => {
    await flowDynamic([
        {
            body: '✨ ¿Qué te gustaría hacer ahora? 👇',
            buttons: [
                { body: '🔄 Nueva Búsqueda' },
                { body: '📞 Soporte' },
                { body: '🔙 Menú Principal' }
            ],
            delay: 2000
        }
    ]);
};
const handleOptions = async (ctx, { gotoFlow, flowDynamic }) => {
    const body = ctx.body?.trim();

    if (body?.includes('Nueva Búsqueda') || body?.includes('🔄')) {
        delete memory[ctx.from];
        return gotoFlow(submenu1Flow);
    }

    if (ctx.body.includes('Soporte') || ctx.body.includes('📞')) {
        await flowDynamic([
            '📞 Soporte Técnico',
            'Número: 323493779 \n🔹 Lunes a Viernes\n⏰ 8:00 a.m. - 12:00 p.m. | 2:00 p.m. - 6:00 p.m. '
        ]);
        return gotoFlow(mainFlow);
    }

    if (body?.includes('Menú Principal') || body?.includes('🔙')) {
        return gotoFlow(mainFlow);
    }

    await flowDynamic("❌ Opción no válida.");
            return gotoFlow(mainFlow);
};
export const buscarConvenioFlow = addKeyword([
    'consultar convenio',
    'buscar convenio',
    'convenio'
])
const equivalencias: { [clave: string]: string[] } = {
    "tarjeta credito": ["tarjeta de credito", "tc", "tajerta credito", "tarjeta crédito"],
    "credito vehiculo": ["vehiculo", "vehículo", "crédito vehículo"],
    "credito libre": ["libre inversion", "libre inversión"],
    // otros términos aquí
};

function obtenerSinonimos(entrada: string): string[] {
    const texto = entrada.trim().toLowerCase();

    for (const [clave, sinonimos] of Object.entries(equivalencias)) {
        if (clave === texto || sinonimos.includes(texto)) {
            return [clave, ...sinonimos];
        }
    }

    return [texto]; // si no tiene sinónimos definidos
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const memory: Record<string, any[]> = {};

export const submenu1Flow = addKeyword(MENU_IDS.PRINCIPAL.OPCION1)
    .addAnswer(
        "¿me podrías decir el nombre del convenio o el NIT que deseas consultar? ¡Con eso haré la búsqueda al instante! 🔍😊",
        { capture: true },
        async (ctx, { flowDynamic, gotoFlow }) => {
            const terminosBuscados = obtenerSinonimos(ctx.body || '');

            try {
                const archivos = ['AVAL.xlsx', 'BBVA.xlsx', 'AGRARIO.xlsx'];
                const coincidenciasTotales: any[] = [];

                for (const archivo of archivos) {
                    const excelPath = resolve(__dirname, '..', 'src','templates','submenus','data', archivo);
                    const workbook = XLSX.readFile(excelPath);
                    const sheetName = workbook.SheetNames[0];
                    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: "A" }) as any[];

                    const columnasBuscar =
                        archivo === 'AVAL.xlsx' ? ['E', 'C']
                        : archivo === 'BBVA.xlsx' ? ['B', 'C']
                        : archivo === 'AGRARIO.xlsx' ? ['B', 'A']
                        : [];

                        const coincidencias = sheet.filter((row) => {
                            return columnasBuscar.some(col => {
                                const valor = row[col]?.toString().toLowerCase();
                                return terminosBuscados.some(termino => valor?.includes(termino));
                            });
                        });

                    const coincidenciasConArchivo = coincidencias.map(c => ({ ...c, __archivo: archivo }));
                    coincidenciasTotales.push(...coincidenciasConArchivo);
                }

                // No hay coincidencias en ningún archivo
                if (coincidenciasTotales.length === 0) {
                    await flowDynamic("❌ No encontramos coincidencias con ese nombre.");
                    return gotoFlow(submenu1Flow);
                }

                // Guardamos en memoria para usar en selección posterior
                memory[ctx.from] = coincidenciasTotales;

                // Agrupar coincidencias por archivo
                const agrupadas = {
                    'AVAL.xlsx': [] as any[],
                    'BBVA.xlsx': [] as any[],
                    'AGRARIO.xlsx': [] as any[]
                };

                coincidenciasTotales.forEach(c => {
                    agrupadas[c.__archivo]?.push(c);
                });

                // Generar mensajes por archivo
                const mensajes: string[] = [];

                if (agrupadas['AVAL.xlsx'].length > 0) {
                    const texto = agrupadas['AVAL.xlsx'].slice(0, 30).map((row, i) => {
                        const nombre = row["D"] || "Nombre_Empresa";
                        const descripcion = row["F"] || "Sigla_Empresa";
                        const footer = row["L"] || "📁 Banco: AVAL";
                        return `*${i + 1}*. ${nombre}\n 🔢${descripcion}\n 📌${footer}`;
                    }).join("\n\n");

                    mensajes.push("🔷 Resultados desde banco de *OCCIDENTE*:\n\n" + texto);
                }

                if (agrupadas['BBVA.xlsx'].length > 0) {
                    const offset = agrupadas['AVAL.xlsx'].length;
                    const texto = agrupadas['BBVA.xlsx'].slice(0, 30).map((row, i) => {
                        const nombre = row["B"] || "Sin nombre";
                        const descripcion = row["C"] || "Sin descripción";
                        const footer = row["G"] || "📁 Banco: BBVA";
                        return `*${i + 1 + offset}*. ${nombre}\n 🔢${descripcion}\n 📌${footer}`;
                    }).join("\n\n");

                    mensajes.push("🟢 Resultados desde banco *BBVA*:\n\n" + texto);
                }

                if (agrupadas['AGRARIO.xlsx'].length > 0) {
                    const offset = agrupadas['AVAL.xlsx'].length + agrupadas['BBVA.xlsx'].length;
                    const texto = agrupadas['AGRARIO.xlsx'].slice(0, 30).map((row, i) => {
                        const nombre = row["B"] || "Sin nombre";
                        const descripcion = row["C"] || "Sin descripción";
                        const footer = row["L"] || "NACIONAL";
                        return `*${i + 1 + offset}*. ${nombre}\n 🔢${descripcion}\n 📌${footer}`;
                    }).join("\n\n");

                    mensajes.push("🟡 Resultados desde banco *AGRARIO*:\n\n" + texto);
                }

                // Limitar tamaño del mensaje para WhatsApp
                const mensajeFinal = mensajes.join("\n\n").slice(0, 3000);

                await flowDynamic([
                    "🔍 Encontramos varias coincidencias. Escribe el número de la opción que quieres elegir 👇",
                    mensajeFinal
                ]);
            } catch (error: any) {
                console.error("❌ Error al enviar mensaje:", error);

                if (error?.response?.status === 400) {
                    await flowDynamic("⚠️ Error al mostrar resultados. Intenta usar un término más específico.");
                } else {
                    await flowDynamic("⚠️ Ocurrió un error inesperado. Intenta más tarde.");
                }

                return gotoFlow(mainFlow);
            }
        }
    )
    .addAnswer(
    '',
    { capture: true },
    async (ctx, { flowDynamic }) => {
        const opciones = memory[ctx.from];
        if (!opciones) return;

        const seleccion = parseInt(ctx.body.trim());
        if (isNaN(seleccion) || seleccion < 1 || seleccion > opciones.length) {
            await flowDynamic("❌ Opción no válida.");
            return;
        }

        const seleccionado = opciones[seleccion - 1];
        const origen = seleccionado.__archivo;

        let respuesta = '';
        let nit = '';

        if (origen === 'AVAL.xlsx') {
            nit = seleccionado["C"] || "";
            const nura = seleccionado["B"] || "Sin NURA";
            const modalidad = seleccionado["J"] || "Sin modalidad";
            const parciales = seleccionado["P"] || "No aplica";
            const categoria = seleccionado["G"] || "No definida";
            const captura = seleccionado["N"] || "No definida";

            respuesta = `📁 BANCO DE *!OCCIDENTE¡*\n✅ NURA: ${nura}\n🔢 NIT: ${nit}\n📦 MODALIDAD: ${modalidad}\n💰 PAGOS PARCIALES: ${parciales}\n🛰️ CAPTURA: ${captura}\n📈 CATEGORÍA: ${categoria}\n \n¡Estamos aquí para ayudarte! 😊`;
        } else if (origen === 'BBVA.xlsx') {
            nit = seleccionado["C"] || "";
            const convenio = seleccionado["A"] || "Sin nombre";
            const recaudo = seleccionado["D"] || "Sin Recaudo";
            const captura = seleccionado["F"] || "Sin dirección";
            const categoria = seleccionado["E"] || "Sin ciudad";
            const referencia = seleccionado["H"] || "Sin Referencia";

            respuesta = `📁 BANCO *!BBVA¡*\n🏢 Convenio: ${convenio}\n💰 Nit: ${nit}\n 🔢 Que se recauda: ${recaudo}\n📍 Categoria: ${categoria}\n 🛰️ Tipo de Captura: ${captura}\n \n🌆 Referencia: ${referencia}\n \n¡Estamos aquí para ayudarte! 😊`;
        } else if (origen === 'AGRARIO.xlsx') {
            nit = seleccionado["C"] || "";
            const referencia = seleccionado["D"] || "Sin nombre";
            const tipo = seleccionado["E"] || "Sin tipo";
            const codigo = seleccionado["G"] || "Sin teléfono";
            const manual = seleccionado["I"] || "Sin horario";

            respuesta = `📁 BANCO *!AGRARIO¡*\n🏢 Referencia: ${referencia}\n 🔢 Nit: ${nit} \n🏷️ Tipo: ${tipo}\n📞 CodigoBarras: ${codigo}\n🕐 Manual: ${manual}\n \n¡Estamos aquí para ayudarte! 😊`;
        }
        // Enviar la respuesta con la información
        await flowDynamic(respuesta);

        // 2. Manejar la imagen si existe
        if (nit) {
            try {
                const imagesPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'templates', 'submenus', 'images');
                const imagePath = resolve(imagesPath, `${nit}.png`);
                
                if (existsSync(imagePath)) {
                    // Enviar imagen con mensaje
                    await flowDynamic([
                        {
                            body: `🖼️ Imagen ilustrativa`,
                            media: imagePath
                        }
                    ]);

                    // 3. Esperar 5 segundos después de la imagen
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } catch (error) {
                console.error("Error al enviar imagen:", error);
                await flowDynamic("⚠️ No pude cargar la imagen asociada");
            }
        }
    await mostrarMenuOpciones(flowDynamic);
        delete memory[ctx.from];
    }
)

    // 👉 Capturar respuesta del botón
    .addAction({ capture: true }, handleOptions)
    .addAction(
        { capture: true },
        async (ctx, { gotoFlow, flowDynamic }) => {
            if (ctx.body.includes('Nueva Búsqueda') || ctx.body.includes('🔄')) {
                return gotoFlow(submenu1Flow);
            }
            if (ctx.body.includes('Soporte') || ctx.body.includes('📞')) {
                await flowDynamic([
                    '📞 Soporte Técnico',
                    'Número: 323493779 \n🔹 Lunes a Viernes\n⏰ 8:00 a.m. - 12:00 p.m. | 2:00 p.m. - 6:00 p.m. '
                ]);
            }
            if (ctx.body.includes('Menú Principal') || ctx.body.includes('🔙')) {
                return gotoFlow(mainFlow);
            }
            await flowDynamic("❌ Opción no válida. Por favor elige un botón.");
            return gotoFlow(mainFlow);
        }
    )
    
    .addAction(
        { capture: true },
        handleOptions 
    );
