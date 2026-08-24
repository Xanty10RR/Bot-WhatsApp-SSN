import 'dotenv/config';
import { createProvider, addKeyword, EVENTS, createFlow, createBot, MemoryDB } from '@builderbot/bot';
import { MetaProvider } from '@builderbot/provider-meta';
import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

const config = {
    PORT: process.env.PORT ?? 3001,
    HOST: process.env.HOST ?? '0.0.0.0',
    jwtToken: process.env.jwtToken,
    numberId: process.env.numberId,
    verifyToken: process.env.verifyToken,
    version: 'v22.0'
};

const provider = createProvider(MetaProvider, {
    jwtToken: config.jwtToken,
    numberId: config.numberId,
    verifyToken: config.verifyToken,
    version: config.version
});

const MENU_IDS = {
    PRINCIPAL: {
        OPCION1: "MENU_PRINCIPAL_OPCION1",
        OPCION2: "MENU_PRINCIPAL_OPCION2",
        OPCION3: "MENU_PRINCIPAL_OPCION3",
    },
    SUBMENU_2: {
        OPCION1: "SUBMENU2_OPCION1",
        OPCION2: "SUBMENU2_OPCION2",
    },
    SUBMENU_3: {
        OPCION1: "SUBMENU3_OPCION1",
        OPCION2: "SUBMENU3_OPCION2"}
};

const mainFlow = addKeyword(['inicio', 'menu', EVENTS.WELCOME])
    .addAnswer('')
    .addAction(async (ctx, { provider }) => {
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
            button: "Ver opciones",
            sections: [
                {
                    title: "Ayuda y Servicios",
                    rows: [
                        {
                            id: MENU_IDS.PRINCIPAL.OPCION1,
                            title: "🔍 Consultar convenio",
                            description: "Solicita información de convenio, instrucciones de pago"
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
    }
    catch (error) {
        console.error("Error al enviar la lista:", error);
    }
});

var mainFlow$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    mainFlow: mainFlow
});

function formatearConvenio(convenio) {
    switch (convenio.banco) {
        case "AGRARIO":
            return `🏦 *BANCO AGRARIO*

📋 *Convenio:*
${convenio.nombre_convenio}

🔢 *Código:*
${convenio.codigo_convenio}

🆔 *NIT:*
${convenio.nit}

📄 *Referencia:*
${convenio.referencia}

🔀 *Tipo referencia:*
${convenio.tipo_referencia}

📏 *Longitud:*
${convenio.longitud_referencia}

🫆 *Código de barras:*
${convenio.codigo_barras}

✍️ *Manual:*
${convenio.manual}`;
        case "BBVA":
            return `🏦 *BANCO BBVA*

📋 *Convenio:*
${convenio.nombre_convenio}

🔢 *Código:*
${convenio.codigo_convenio}

🆔 *NIT:*
${convenio.nit}

📂 *Categoría:*
${convenio.categoria}

📦 *Tipo captura:*
${convenio.tipo_captura}

📄 *Referencias:*
${convenio.referencias}`;
        case "AVAL":
            return `🏦 *BANCO AVAL*

🏢 *Empresa:*
${convenio.empresa}

📋 *Convenio:*
${convenio.nombre_convenio}

🆔 *NIT:*
${convenio.nit}

🏷️ *Sigla:*
${convenio.sigla}

🖥️ *Modalidad:*
${convenio.modalidad}

📊 *Dato captura:*
${convenio.dato_captura}

📝 *Descripción recaudo:*
${convenio.descripcion_recaudo}`;
        default:
            return "❌ Convenio no encontrado.";
    }
}

dotenv.config();
const pool$2 = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: {
        rejectUnauthorized: false,
    },
});

class ConvenioService {
    static async buscar(texto) {
        const termino = `%${texto.toLowerCase()}%`;
        const [bbva, agrario, aval] = await Promise.all([
            pool$2.query(`
      SELECT
        'BBVA' AS banco,
        codigo_convenio,
        nombre_convenio,
        nit,
        categoria,
        tipo_captura,
        referencias
      FROM bbva
      WHERE
        LOWER(nombre_convenio) LIKE $1
        OR LOWER(nit) LIKE $1
      `, [termino]),
            pool$2.query(`
      SELECT
        'AGRARIO' AS banco,
        codigo_convenio,
        nombre_convenio,
        nit_convenio AS nit,
        referencia,
        tipo_referencia,
        longitud_referencia,
        codigo_barras,
        manual
      FROM agrario
      WHERE
        LOWER(nombre_convenio) LIKE $1
        OR LOWER(nit_convenio) LIKE $1
      `, [termino]),
            pool$2.query(`
      SELECT
        'AVAL' AS banco,
        nit AS codigo_convenio,
        convenio AS nombre_convenio,
        nit,
        empresa,
        sigla,
        modalidad,
        dato_captura,
        descripcion_recaudo
      FROM aval
      WHERE
        LOWER(convenio) LIKE $1
        OR LOWER(empresa) LIKE $1
        OR LOWER(sigla) LIKE $1
        OR LOWER(nit) LIKE $1
      `, [termino]),
        ]);
        return {
            total: bbva.rows.length + agrario.rows.length + aval.rows.length,
            bbva: bbva.rows,
            agrario: agrario.rows,
            aval: aval.rows,
        };
    }
    static async obtenerPorId(banco, id) {
        switch (banco) {
            case "BBVA": {
                const { rows } = await pool$2.query(`
        SELECT
          'BBVA' AS banco,
          codigo_convenio,
          nombre_convenio,
          nit,
          categoria,
          tipo_captura,
          referencias
        FROM bbva
        WHERE codigo_convenio = $1
        LIMIT 1
        `, [id]);
                return rows[0] ?? null;
            }
            case "AGRARIO": {
                const { rows } = await pool$2.query(`
        SELECT
          'AGRARIO' AS banco,
          codigo_convenio,
          nombre_convenio,
          nit_convenio AS nit,
          referencia,
          tipo_referencia,
          longitud_referencia,
          codigo_barras,
          manual
        FROM agrario
        WHERE codigo_convenio = $1
        LIMIT 1
        `, [id]);
                return rows[0] ?? null;
            }
            case "AVAL": {
                const { rows } = await pool$2.query(`
        SELECT
          'AVAL' AS banco,
          nit AS codigo_convenio,
          convenio AS nombre_convenio,
          nit,
          empresa,
          sigla,
          modalidad,
          dato_captura,
          descripcion_recaudo
        FROM aval
        WHERE nit = $1
        LIMIT 1
        `, [id]);
                return rows[0] ?? null;
            }
            default:
                return null;
        }
    }
    static async sugerir(texto) {
        const [bbva, agrario, aval] = await Promise.all([
            pool$2.query(`
      SELECT
        nombre_convenio,
        similarity(lower(nombre_convenio), lower($1)) AS score
      FROM bbva
      ORDER BY score DESC
      LIMIT 1
      `, [texto]),
            pool$2.query(`
      SELECT
        nombre_convenio,
        similarity(lower(nombre_convenio), lower($1)) AS score
      FROM agrario
      ORDER BY score DESC
      LIMIT 1
      `, [texto]),
            pool$2.query(`
      SELECT
        convenio AS nombre_convenio,
        similarity(lower(convenio), lower($1)) AS score
      FROM aval
      ORDER BY score DESC
      LIMIT 1
      `, [texto]),
        ]);
        const candidatos = [bbva.rows[0], agrario.rows[0], aval.rows[0]].filter(Boolean);
        candidatos.sort((a, b) => b.score - a.score);
        return candidatos.length ? candidatos[0] : null;
    }
}

const __filename$2 = fileURLToPath(import.meta.url);
const __dirname$2 = dirname(__filename$2);
const mostrarMenuBotones = async (ctx, texto, botones) => {
    const token = process.env.jwtToken;
    const numberId = process.env.numberId;
    if (!token || !numberId) {
        console.error("❌ Faltan las variables jwtToken o numberId en el .env");
        return;
    }
    const payloadBotones = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: ctx.from,
        type: "interactive",
        interactive: {
            type: "button",
            body: { text: texto },
            action: {
                buttons: botones.map(b => ({
                    type: "reply",
                    reply: { id: b.id, title: b.title }
                }))
            }
        }
    };
    try {
        const url = `https://graph.facebook.com/v20.0/${numberId}/messages`;
        await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payloadBotones)
        });
    }
    catch (error) {
        console.error("❌ Error enviando botones:", error);
    }
};
const sugerenciaFlow = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { state }) => {
    const myState = state.getMyState();
    const texto = `❌ No encontré coincidencias para:\n\n"${myState.textoOriginal}"\n\n🤔 ¿Quisiste decir?\n\n📋 *${myState.sugerenciaTexto}*\n\n✅ Presiona *SI* para consultar este convenio.\n\n🔄 O presiona *OTRO NOMBRE* para realizar una nueva búsqueda.`;
    await mostrarMenuBotones(ctx, texto, [
        { id: "btn_si", title: "SI" },
        { id: "btn_otro", title: "OTRO NOMBRE" }
    ]);
})
    .addAnswer("", { capture: true }, async (ctx, { state, flowDynamic, gotoFlow }) => {
    const opcion = ctx.body.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const myState = state.getMyState();
    if ((opcion === "si" || opcion === "btn_si" || opcion === "1") && myState.sugerenciaTexto) {
        const texto = myState.sugerenciaTexto;
        const resultado = await ConvenioService.buscar(texto);
        const coincidencias = [...resultado.bbva, ...resultado.agrario, ...resultado.aval];
        await state.update({ sugerenciaTexto: null, textoOriginal: null });
        if (coincidencias.length === 1) {
            const convenio = coincidencias[0];
            await flowDynamic(formatearConvenio(convenio));
            const rutaImagen = resolve(__dirname$2, "images", `${convenio.codigo_convenio}.png`);
            if (existsSync(rutaImagen)) {
                await flowDynamic([{ body: "📷 *Instructivo para realizar el recaudo.*", media: rutaImagen }]);
            }
            await new Promise((resolve) => setTimeout(resolve, 1500));
            await flowDynamic("✍️ *Escribe el número de tu opción (1, 2 o 3)* para continuar:\n\n" +
                "1️⃣ 🔄 Buscar\n" +
                "2️⃣ 🏠 Menú\n" +
                "3️⃣ 📞 Soporte\n\n");
            return;
        }
        await state.update({ listaConvenios: coincidencias });
        return gotoFlow(seleccionarConvenioFlow);
    }
    if (opcion.includes("otro") || opcion === "btn_otro" || opcion === "2") {
        return gotoFlow(submenu1Flow);
    }
    return gotoFlow(submenu1Flow);
})
    .addAnswer("", { capture: true }, async (ctx, { flowDynamic, gotoFlow, fallBack }) => {
    const opcion = ctx.body.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (opcion === "1" || opcion === "buscar")
        return gotoFlow(submenu1Flow);
    if (opcion === "2" || opcion === "menu")
        return gotoFlow(mainFlow);
    if (opcion === "3" || opcion === "soporte") {
        await flowDynamic(`📞 *Soporte Técnico*\n📱 323493779\n🕗 L-S: 7:30am - 02:00pm / 02:00pm - 10:00pm`);
        return gotoFlow(mainFlow);
    }
    return fallBack("❌ Opción no válida.\n\nPor favor, escribe solo el número:\n1️⃣ 🔄 Buscar\n2️⃣ 🏠 Menú\n3️⃣ 📞 Soporte");
});

const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = dirname(__filename$1);
const submenu1Flow = addKeyword(MENU_IDS.PRINCIPAL.OPCION1)
    .addAnswer("✍️ Escribe el NIT, nombre, empresa o sigla del convenio que deseas consultar.", { capture: true }, async (ctx, { flowDynamic, gotoFlow, state }) => {
    const texto = ctx.body.trim();
    const resultado = await ConvenioService.buscar(texto);
    const coincidencias = [
        ...resultado.bbva,
        ...resultado.agrario,
        ...resultado.aval,
    ];
    if (coincidencias.length === 0) {
        const sugerencia = await ConvenioService.sugerir(texto);
        if (sugerencia && sugerencia.score >= 0.20) {
            await state.update({
                sugerenciaTexto: sugerencia.nombre_convenio,
                textoOriginal: texto,
            });
            return gotoFlow(sugerenciaFlow);
        }
        await flowDynamic("❌ No encontré coincidencias.");
        return gotoFlow(mainFlow);
    }
    if (coincidencias.length === 1) {
        const convenio = coincidencias[0];
        await flowDynamic(formatearConvenio(convenio));
        const rutaImagen = resolve(__dirname$1, "images", `${convenio.codigo_convenio}.png`);
        if (existsSync(rutaImagen)) {
            await flowDynamic([
                {
                    body: "📷 *Instructivo para realizar el recaudo de este convenio.*",
                    media: rutaImagen,
                },
            ]);
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await flowDynamic("✍️ *Escribe el número de tu opción (1, 2 o 3)* para continuar:\n\n" +
            "1️⃣ 🔄 Buscar\n" +
            "2️⃣ 🏠 Menú\n" +
            "3️⃣ 📞 Soporte\n\n");
        return;
    }
    await state.update({ listaConvenios: coincidencias });
    return gotoFlow(seleccionarConvenioFlow);
})
    .addAnswer("", { capture: true }, async (ctx, { flowDynamic, gotoFlow, fallBack }) => {
    const opcion = ctx.body
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    if (opcion === "1" || opcion === "buscar")
        return gotoFlow(submenu1Flow);
    if (opcion === "2" || opcion === "menu")
        return gotoFlow(mainFlow);
    if (opcion === "3" || opcion === "soporte") {
        await flowDynamic(`📞 *Soporte Técnico*\n📱 323493779\n🕗 L-S: 7:30am - 02:00pm / 02:00pm - 10:00pm`);
        return gotoFlow(mainFlow);
    }
    return fallBack("❌ Opción no válida.\n\nPor favor, escribe solo el número:\n1️⃣ 🔄 Buscar\n2️⃣ 🏠 Menú\n3️⃣ 📞 Soporte");
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const seleccionarConvenioFlow = addKeyword(EVENTS.ACTION)
    .addAction(async (ctx, { state, flowDynamic }) => {
    const myState = state.getMyState();
    const listaCompleta = myState.listaConveniosOriginal || myState.listaConvenios || [];
    const pagina = myState.paginaConvenios || 0;
    const porPagina = 50;
    const inicio = pagina * porPagina;
    const fin = inicio + porPagina;
    const sliceConvenios = listaCompleta.slice(inicio, fin);
    let mensaje = `🔎 Encontré *${listaCompleta.length} coincidencias en total* (_Página_ _${pagina + 1}_ _de_ _${Math.ceil(listaCompleta.length / porPagina)}_):\n\n`;
    sliceConvenios.forEach((item, index) => {
        const numeroReal = inicio + index + 1;
        mensaje += `*${numeroReal}.* ${item.nombre_convenio}\n🏦 ${item.banco}\n\n`;
    });
    mensaje += "✍️ Escribe el número del convenio que deseas seleccionar.";
    if (fin < listaCompleta.length) {
        mensaje += "\n\n➡️ Escribe *MAS* para ver los siguientes resultados.";
    }
    await state.update({
        listaConveniosOriginal: listaCompleta,
        listaConvenios: sliceConvenios,
        paginaConvenios: pagina
    });
    await flowDynamic(mensaje);
})
    .addAnswer("", { capture: true }, async (ctx, { state, flowDynamic, fallBack, gotoFlow }) => {
    const myState = state.getMyState();
    const textoIngresado = ctx.body.trim().toLowerCase();
    if (textoIngresado === "mas" || textoIngresado === "más") {
        const listaCompleta = myState.listaCompletaConvenios || myState.listaConveniosOriginal || [];
        const pagina = (myState.paginaConvenios || 0) + 1;
        const porPagina = 50;
        if (pagina * porPagina < listaCompleta.length) {
            await state.update({ paginaConvenios: pagina, listaConvenios: listaCompleta });
            return gotoFlow(seleccionarConvenioFlow);
        }
        else {
            await flowDynamic("⚠️ No hay más resultados en la lista.");
            return;
        }
    }
    const numero = parseInt(textoIngresado);
    const coincidenciasActivas = myState.listaConvenios || [];
    if (isNaN(numero) || numero < 1) {
        return fallBack("❌ Número inválido. Por favor, escribe un número de la lista o escribe *MAS*.");
    }
    const listaCompleta = myState.listaConveniosOriginal || coincidenciasActivas;
    const convenio = listaCompleta[numero - 1];
    if (!convenio) {
        return fallBack("❌ El número seleccionado no está en el rango de la lista. Por favor, escribe un *número válido que se encuentre dentro de la lista* para continuar.");
    }
    await flowDynamic(formatearConvenio(convenio));
    const rutaImagen = resolve(__dirname, "images", `${convenio.codigo_convenio}.webp`);
    if (existsSync(rutaImagen)) {
        await flowDynamic([{ body: "📷 *Instructivo para realizar el recaudo.*", media: rutaImagen }]);
    }
    await state.update({ listaConvenios: null, listaConveniosOriginal: null, paginaConvenios: null });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await flowDynamic("✍️ *Escribe el número de tu opción (1, 2 o 3)* para continuar:\n\n" +
        "1️⃣ 🔄 Buscar\n" +
        "2️⃣ 🏠 Menú\n" +
        "3️⃣ 📞 Soporte\n\n");
})
    .addAnswer("", { capture: true }, async (ctx, { flowDynamic, gotoFlow, fallBack }) => {
    const opcion = ctx.body.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (opcion === "1" || opcion === "buscar")
        return gotoFlow(submenu1Flow);
    if (opcion === "2" || opcion === "menu")
        return gotoFlow(mainFlow);
    if (opcion === "3" || opcion === "soporte") {
        await flowDynamic(`📞 *Soporte Técnico*\n📱 323493779\n🕗 L-S: 7:30am-02:00pm / 02:00pm-10:00pm`);
        return gotoFlow(mainFlow);
    }
    return fallBack("❌ Opción no válida.\n\nPor favor, escribe solo el número:\n1️⃣ 🔄 Buscar\n2️⃣ 🏠 Menú\n3️⃣ 📞 Soporte");
});

const submenu2Flow = addKeyword(MENU_IDS.PRINCIPAL.OPCION2)
    .addAnswer("Se te revelo el sistema?")
    .addAnswer("¿Qué tipo de ayuda quieres?", {
    capture: false
}, async (ctx, { provider }) => {
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

const submenu3Flow = addKeyword(MENU_IDS.PRINCIPAL.OPCION3)
    .addAnswer("", { capture: false })
    .addAction(async (ctx, { provider }) => {
    const list = {
        header: {
            type: "text",
            text: "Gestión de requisiciones"
        },
        body: {
            text: "Este proceso pertenece a *logística*.\nSelecciona la acción que deseas realizar:"
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
                            id: MENU_IDS.SUBMENU_3.OPCION1,
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
    }
    catch (error) {
        console.error("Error al enviar lista:", error);
        await provider.sendText(ctx.from, "Por favor elige una opción:");
        await provider.sendText(ctx.from, "1. Solicitar requisición");
        await provider.sendText(ctx.from, "2. Aprobar requisición");
    }
});

const dbPort = Number(process.env.DB_PORT ?? "5432");
const pool$1 = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: dbPort,
});
const RequisicionSolicitud = addKeyword(MENU_IDS.SUBMENU_3.OPCION1)
    .addAnswer("¡Vamos a crear una nueva requisición!.\nPor favor, dime tu *nombre completo* (_solo texto_):", { capture: true }, async (ctx, { state, fallBack }) => {
    const nombre = ctx.body.trim();
    if (/\d/.test(nombre)) {
        return fallBack("❌ El nombre no debe contener números. Por favor, escribe tu nombre completo solo con letras:");
    }
    await state.update({ nombre });
})
    .addAnswer("Por favor coloca tu *número de cédula* completo (_solo números_):", { capture: true }, async (ctx, { state, fallBack }) => {
    const cedula = ctx.body.trim();
    if (!/^\d+$/.test(cedula)) {
        return fallBack("❌ La cédula debe contener únicamente números. Por favor, ingrésala de nuevo:");
    }
    await state.update({ cedula });
})
    .addAnswer([
    "Marca el número del *departamento* donde quieres enviar la requisición:",
    "",
    "1. 📦 Logística",
    "2. 👤 RRHH",
    "3. 💻 IT/Sistemas",
    "4. 💰 Comercial",
    "5. 🤔 Otros",
].join("\n"), { capture: true }, async (ctx, { flowDynamic, state, fallBack }) => {
    const mapaDept = {
        "1": "Logística",
        "2": "RRHH",
        "3": "IT/Sistemas",
        "4": "Comercial",
        "5": "Otros",
    };
    const seleccion = ctx.body.trim();
    const departamento = mapaDept[seleccion];
    if (!departamento) {
        return fallBack("❌ Opción no válida. Por favor responde con un número del 1 al 5.");
    }
    await state.update({ departamento_destino: departamento });
    await flowDynamic(`Has seleccionado: *${departamento}*`);
})
    .addAnswer("⚠️ Si usted es *ASESOR* escriba el *código de punto de venta* o si usted es *ADMINISTRATIVO* marque *000* (_solo números_):", { capture: true }, async (ctx, { state, fallBack }) => {
    const input = ctx.body.trim();
    if (!/^\d+$/.test(input)) {
        return fallBack("❌ Formato inválido. Debes ingresar solo números. Inténtalo de nuevo:");
    }
    await state.update({ asesor_o_administrativo: input });
})
    .addAnswer([
    "Marca de qué *tipo es tu solicitud:*",
    "1. 🛒 Compras",
    "2. 🛠️ Mantenimiento",
    "3. 🚕 Transporte",
    "4. 🤔 Otros",
].join("\n"), { capture: true }, async (ctx, { flowDynamic, state, fallBack }) => {
    const opcion = parseInt(ctx.body.trim());
    if (isNaN(opcion) || opcion < 1 || opcion > 4) {
        return fallBack("❌ Opción inválida. Por favor selecciona un número del 1 al 4.");
    }
    const tipos = ["Compras", "Mantenimiento", "Transporte", "Otros"];
    const tipoSeleccionado = tipos[opcion - 1];
    await state.update({ tipo_solicitud: tipoSeleccionado });
})
    .addAnswer([
    "Marca de qué *tipo es tu Elemento:*",
    "1. 💎 Activo",
    "2. ♻️ Insumo",
    "3. 🛠️ Repuesto",
    "4. 💼 Servicio",
].join("\n"), { capture: true }, async (ctx, { flowDynamic, state, fallBack }) => {
    const opcion = parseInt(ctx.body.trim());
    if (isNaN(opcion) || opcion < 1 || opcion > 4) {
        return fallBack("❌ Opción inválida. Por favor selecciona un número del 1 al 4.");
    }
    const tipos = ["Activo", "Insumo", "Repuesto", "Servicio"];
    const tipoSeleccionado = tipos[opcion - 1];
    await state.update({ tipo_elemento: tipoSeleccionado });
})
    .addAnswer("Por favor escriba una *descripción detallada:*", { capture: true }, async (ctx, { state }) => {
    await state.update({ descripcion: ctx.body });
})
    .addAnswer("Indique la *cantidad necesaria:*", { capture: true }, async (ctx, { state, fallBack }) => {
    const input = ctx.body.trim();
    if (!/^\d+$/.test(input)) {
        return fallBack("❌ Formato inválido. Debes ingresar solo números. Inténtalo de nuevo:");
    }
    await state.update({ cantidad: input });
})
    .addAnswer("Agregue alguna *observación adicional:*", { capture: true }, async (ctx, { state }) => {
    await state.update({ observaciones: ctx.body });
})
    .addAction(async (ctx, { state, flowDynamic }) => {
    const datos = state.getMyState();
    try {
        await pool$1.query(`INSERT INTO requisiciones (
                usuario_whatsapp, nombre_solicitante, cedula_solicitante, departamento, 
                asesor_o_administrativo, tipo_solicitud, tipo_elemento, 
                descripcion, cantidad, observaciones
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, [
            ctx.from,
            datos.nombre,
            datos.cedula,
            datos.departamento_destino,
            datos.asesor_o_administrativo,
            datos.tipo_solicitud,
            datos.tipo_elemento,
            datos.descripcion,
            datos.cantidad,
            datos.observaciones,
        ]);
        await flowDynamic("✅ Solicitud guardada exitosamente. Se ha notificado al jefe del área.");
    }
    catch (error) {
        console.error("Error al guardar:", error);
        await flowDynamic("❌ Error al guardar la requisición.");
    }
    await flowDynamic([
        {
            body: "¿Qué deseas hacer ahora?",
            buttons: [
                { body: "📝 Nueva" },
                { body: "🏠 Menú" },
            ],
        },
    ]);
})
    .addAction({ capture: true }, async (ctx, { gotoFlow }) => {
    if (ctx.body.includes("Nueva") || ctx.body.includes("📝"))
        return gotoFlow(RequisicionSolicitud);
    const { mainFlow } = await Promise.resolve().then(function () { return mainFlow$1; });
    return gotoFlow(mainFlow);
});

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
});
const VerificarIdentidad = addKeyword(MENU_IDS.SUBMENU_3.OPCION2)
    .addAnswer([
    "🔐 *¿Usuario real?*\nIngresa tu usuario y contraseña separados por una coma.",
    "Ejemplo: `usuario, contraseña`",
    "",
    "💡 *¿Usuario invitado?*\nIngresa con las credenciales: `usuarioinvitado, usuarioinvitado` para ingresar",
    "*(Recuerda crear una requisición antes de aprobarla)*",
].join("\n"), { capture: true }, async (ctx, { state, flowDynamic, gotoFlow }) => {
    const partes = ctx.body.split(",");
    if (partes.length !== 2) {
        await flowDynamic("❌ Formato inválido. Usa el formato:\n*usuario, contraseña*");
        await flowDynamic([
            {
                body: "¿Qué deseas hacer ahora?",
                buttons: [{ body: "🔁 Otro intento" }, { body: "🏠 Menú" }],
            },
        ]);
        return;
    }
    const [usuarioIngresado, claveIngresada] = partes.map((p) => p.trim());
    try {
        if (usuarioIngresado === "usuarioinvitado" &&
            claveIngresada === "usuarioinvitado") {
            const registros = await pool.query("SELECT * FROM requisiciones WHERE estado = 'pendiente'");
            const filas = registros.rows;
            if (filas.length === 0) {
                await flowDynamic("📭 No hay requisiciones pendientes.");
                return gotoFlow(mainFlow);
            }
            await state.update({
                usuario: "invitado",
                tablaAsignada: "requisiciones",
                registros: filas,
            });
            const opciones = filas.map((f, i) => `${i + 1}. ${f.nombre_solicitante} - ${f.tipo_solicitud}`);
            await flowDynamic([
                "✅ *Modo invitado activado*\nRegistros disponibles:",
                ...opciones,
            ]);
            await flowDynamic("✏️ Escribe el *número del registro* que deseas ver en detalle.");
            return;
        }
        const result = await pool.query("SELECT * FROM usuarios_aprobadores WHERE usuario = $1", [usuarioIngresado]);
        if (result.rows.length === 0) {
            await flowDynamic("❌ Usuario no encontrado.");
            await flowDynamic([
                {
                    body: "¿Qué deseas hacer ahora?",
                    buttons: [
                        { body: "🔁 Otro intento" },
                        { body: "🏠 Menú" },
                    ],
                },
            ]);
            return;
        }
        const usuario = result.rows[0];
        const claveValida = await bcrypt.compare(claveIngresada, usuario.clave);
        if (!claveValida) {
            await flowDynamic("❌ Contraseña incorrecta.");
            await flowDynamic([
                {
                    body: "¿Qué deseas hacer ahora?",
                    buttons: [{ body: "🔁 Otro intento" }, { body: "🏠 Menú" }],
                },
            ]);
            return;
        }
        const tablaAsignada = usuario.tabla_asignada;
        const deptoJefe = usuario.departamento;
        const query = `SELECT * FROM ${tablaAsignada} WHERE departamento = $1 AND estado = 'pendiente'`;
        const registros = await pool.query(query, [deptoJefe]);
        const filas = registros.rows;
        if (filas.length === 0) {
            await flowDynamic("📭 No hay registros en tu tabla asignada.");
            return gotoFlow(mainFlow);
        }
        const opciones = filas.map((fila, i) => `${i + 1}. ${fila.nombre_solicitante} - ${fila.tipo_solicitud}`);
        await state.update({
            usuario: usuarioIngresado,
            tablaAsignada,
            registros: filas,
        });
        await flowDynamic([
            "✅ Autenticación exitosa. \n 📋 Estos son los registros disponibles:",
            ...opciones,
        ]);
        await flowDynamic("✏️ Escribe el *número del registro* que deseas ver en detalle.");
    }
    catch (error) {
        console.error("Error al verificar identidad:", error);
        await flowDynamic("❌ Ocurrió un error al procesar tu solicitud.");
        await flowDynamic([
            {
                body: "¿Qué deseas hacer ahora?",
                buttons: [{ body: "🔁 Otro intento" }, { body: "🏠 Menú" }],
            },
        ]);
    }
})
    .addAnswer("", { capture: true }, async (ctx, { state, flowDynamic, fallBack, gotoFlow }) => {
    const input = ctx.body.trim().toLowerCase();
    if (input.includes("otro intento") || input.includes("reintentar")) {
        return gotoFlow(VerificarIdentidad);
    }
    if (input.includes("menú") || input.includes("menu")) {
        return gotoFlow(mainFlow);
    }
    const registros = (await state.get("registros")) || [];
    if (!/^\d+$/.test(input)) {
        return fallBack("❌ Número inválido. Por favor, escribe un número de la lista:");
    }
    const indice = parseInt(input, 10) - 1;
    if (indice < 0 || indice >= registros.length) {
        return fallBack("❌ Número inválido. Por favor, escribe un número de la lista:");
    }
    const registro = registros[indice];
    const segundoValor = Object.values(registro)[1];
    await state.update({
        selectedRegistro: registro,
        numeroSolicitante: segundoValor,
    });
    const mensajeDetalle = [
        "📄 *Detalles del registro seleccionado:*",
        "",
        `👤 *Solicitante:* ${registro.nombre_solicitante}`,
        `📱 *Teléfono:* ${registro.usuario_whatsapp}`,
        `🪪 *Cédula:* ${registro.cedula_solicitante}`,
        `🏢 *Departamento:* ${registro.departamento}`,
        `⚠️ *Punto de venta o administrativo:* ${registro.asesor_o_administrativo}`,
        `📌 *Tipo de solicitud:* ${registro.tipo_solicitud}`,
        `🔰 *Tipo de elemento:* ${registro.tipo_elemento}`,
        `📝 *Descripción:* ${registro.descripcion}`,
        `📦 *Cantidad:* ${registro.cantidad}`,
        `💬 *Observaciones:* ${registro.observaciones || "Ninguna"}`,
        `📝 *Estado:* ${registro.estado || "Pendiente"}`,
        `🕒 *Fecha y hora:* ${new Date(registro.fecha_creacion).toLocaleDateString("es-CO")}`,
    ].join("\n");
    await flowDynamic(mensajeDetalle);
    await flowDynamic([
        "🔍 *Selecciona una acción:*",
        "1. ✅ Aprobar",
        "2. ❌ Rechazar",
        "3. 🔍 Ver número",
        "4. 🏠 Menú principal",
    ].join("\n"));
})
    .addAnswer("Elige una opción de acción:", { capture: true }, async (ctx, { state, flowDynamic, gotoFlow, fallBack }) => {
    try {
        const input = ctx.body.trim();
        if (!/^\d+$/.test(input)) {
            return fallBack("❌ Opción inválida. Elige un número del 1 al 4:");
        }
        const opcion = parseInt(input, 10);
        const stateData = await state.getMyState();
        const selectedRegistro = stateData?.selectedRegistro;
        const tablaAsignada = stateData?.tablaAsignada;
        const usuario = stateData?.usuario;
        const numeroSolicitante = stateData?.numeroSolicitante;
        if (!selectedRegistro?.nombre_solicitante) {
            return fallBack("❌ No hay un registro seleccionado válido.");
        }
        if (opcion < 1 || opcion > 4) {
            return fallBack("❌ Opción inválida. Elige un número del 1 al 4:");
        }
        switch (opcion) {
            case 1: {
                const idRegistro = selectedRegistro.id;
                await pool.query(`INSERT INTO registro_aprobaciones (datos_completos, estado, aprobador, tabla_origen, fecha_decision) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`, [
                    JSON.stringify(selectedRegistro),
                    "aprobado",
                    usuario,
                    tablaAsignada,
                ]);
                await pool.query(`DELETE FROM ${tablaAsignada} WHERE id = $1`, [
                    idRegistro,
                ]);
                await flowDynamic("🟢 Solicitud aprobada y guardada en base de datos.");
                return gotoFlow(mainFlow);
            }
            case 2: {
                const idRegistro = selectedRegistro.id;
                await pool.query(`INSERT INTO registro_aprobaciones (datos_completos, estado, aprobador, tabla_origen, fecha_decision) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`, [
                    JSON.stringify(selectedRegistro),
                    "rechazado",
                    usuario,
                    tablaAsignada,
                ]);
                await pool.query(`DELETE FROM ${tablaAsignada} WHERE id = $1`, [
                    idRegistro,
                ]);
                await flowDynamic("🔴 Solicitud rechazada y guardada en base de datos.");
                return gotoFlow(mainFlow);
            }
            case 3: {
                if (!numeroSolicitante) {
                    await flowDynamic("❌ No se encontró número de contacto.");
                    break;
                }
                await flowDynamic(`📱 Número del solicitante:\n${numeroSolicitante}`);
                await flowDynamic([
                    "🔍 *Selecciona una acción:*",
                    "1. ✅ Aprobar",
                    "2. ❌ Rechazar",
                    "3. 🔍 Ver número",
                    "4. 🏠 Menú principal",
                ].join("\n"));
                return;
            }
            case 4:
                return gotoFlow(mainFlow);
        }
    }
    catch (error) {
        console.error("Error en acción:", error);
        await flowDynamic("❌ Ocurrió un error al procesar en la base de datos.");
        return gotoFlow(mainFlow);
    }
});

var templates = createFlow([
    RequisicionSolicitud,
    VerificarIdentidad,
    seleccionarConvenioFlow,
    sugerenciaFlow,
    submenu1Flow,
    submenu2Flow,
    submenu3Flow,
    mainFlow
]);

let botPromise;
const getBot = () => {
    botPromise ??= createBot({
        flow: templates,
        provider,
        database: new MemoryDB(),
    });
    return botPromise;
};

const main = async () => {
    const { httpServer } = await getBot();
    const port = Number(config.PORT || 3001);
    httpServer(port);
    console.log(`✅ Bot corriendo en http://localhost:${port}`);
};
main().catch(console.error);
