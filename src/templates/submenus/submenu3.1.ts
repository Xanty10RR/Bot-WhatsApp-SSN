import { addKeyword } from "@builderbot/bot";
import { MENU_IDS } from "../constants";
import { Pool } from 'pg';

// Configuración de PostgreSQL
const dbPort = Number(process.env.DB_PORT ?? "5432");

export const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: dbPort,
});

export const RequisicionSolicitud = addKeyword(MENU_IDS.SUBMENU_3.OPCION1)
    .addAnswer(
        "¡Vamos a crear una nueva requisición!.\nPor favor, dime tu *nombre completo*: ",
        { capture: true },
        async (ctx, { flowDynamic, state }) => {
            await state.update({ nombre: ctx.body });
            return null;
        }
    )
    .addAnswer(
        "Por favor coloca tu *numero de cédula* completo:",
        { capture: true },
        async (ctx, { flowDynamic, state }) => {
            await state.update({ cedula: ctx.body });
            return null;
        }
    )
    .addAnswer(
        "Marca a qué *departamento* quieres enviar la requisición:\n\n" +
        "1. 📦 Logística\n" +
        "2. 👤 RRHH\n" +
        "3. 💻 IT/Sistemas\n" +
        "4. 💰 Comercial\n" +
        "5. 🤔 Otros",
        { capture: true },
        async (ctx, { flowDynamic, state }) => {
            const opcion = ctx.body.trim();
            let departamento = '';
            
            switch(opcion) {
                case '1':
                    departamento = 'Logística';
                    break;
                case '2':
                    departamento = 'RRHH';
                    break;
                case '3':
                    departamento = 'Tic';
                    break;
                case '4':
                    departamento = 'Comercial';
                    break;
                case '5':
                    departamento = 'Otros';
                    break;
                default:
                    await flowDynamic("❌ Opción no válida. Por favor responde con 1, 2, 3, 4 o 5.");
                    return null;
            }

            await state.update({ departamento_destino: departamento });
            await flowDynamic(`Has seleccionado: *${departamento}*`);
        }
    )
    // Flujos condicionales para cada departamento
    .addAnswer(
        "⚠️ Mencione el *código de punto de venta* o si es *administrativo*:",
        { capture: true },
        async (ctx, { flowDynamic, state }) => {
            await state.update({ codigo_costo: ctx.body });
            return null;
        }
    )
    .addAnswer(
        "⚠️ Mencione el *código de punto de venta* o si es *administrativo marque 0000*:",
        { capture: true },
        async (ctx, { flowDynamic, state }) => {
            await state.update({ punto_venta: ctx.body });
            return null;
        }
    )
    .addAnswer(
        "Marca de que tipo es tu solicitud:\n\n" +
        "1. 🛒 Compras\n" +
        "2. 🛠️ Mantenimiento\n" +
        "3. 🚕 Transporte\n" +
        "4. 🤔 Otros",
        { capture: true },
        async (ctx, { flowDynamic, state }) => {
            const opcion = parseInt(ctx.body.trim());
            const tipos = ["Compra", "Mantenimiento", "Transporte", "Otros"];
    
            // Validar que la opción esté entre 1 y 4
            if (isNaN(opcion) || opcion < 1 || opcion > 4) {
                await flowDynamic("❌ Opción inválida. Por favor, responde con 1, 2, 3 o 4.");
                return null;
            }
    
            // Guardar la opción seleccionada en el estado
            await state.update({ tipo_solicitud: tipos[opcion - 1] });
            return null;
        }
    )
    .addAnswer(
        "Marca de que tipo es tu Elemento:\n\n" +
        "1. 💎 Activo\n" +
        "2. ♻️ Insumo\n" +
        "3. 🛠️ Repuesto\n" +
        "4. 💼 Servicio",
        { capture: true },
        async (ctx, { flowDynamic, state }) => {
            const opcion = parseInt(ctx.body.trim());
            const tipos = ["Activo", "Insumo", "Repuesto", "Servicio"];
    
            // Validar que la opción esté entre 1 y 4
            if (isNaN(opcion) || opcion < 1 || opcion > 4) {
                await flowDynamic("❌ Opción inválida. Por favor, responde con 1, 2, 3 o 4.");
                return null;
            }
    
            // Guardar la opción seleccionada en el estado
            await state.update({ tipo_elemento: tipos[opcion - 1] });
            return null;
        }
    )
    
    .addAnswer(
        "Por favor escriba una descripción detallada de lo que necesita:",
        { capture: true },
        async (ctx, { flowDynamic, state }) => {
            await state.update({ descripcion: ctx.body });
            return null;
        }
    )
    .addAnswer(
        "Indique la cantidad necesaria (*Número*):",
        { capture: true },
        async (ctx, { flowDynamic, state }) => {
            const cantidad = parseInt(ctx.body);
            if (isNaN(cantidad)) {
                await flowDynamic("❌ Por favor ingrese un número válido");
                return null;
            }
            await state.update({ cantidad });
            return null;
        }
    )
    .addAnswer(
        "Agregue alguna observación adicional (*Texto*):",
        { capture: true },
        async (ctx, { flowDynamic, state }) => {
            await state.update({ observaciones: ctx.body });
            return null;
        }
    )
    .addAction(
        async (ctx, { state, flowDynamic, gotoFlow }) => {
            const datos = state.getMyState();
            const { departamento_destino } = datos;

            try {
                if (departamento_destino === 'Logística') {
                    await pool.query(
                        `INSERT INTO requisiciones_logistica (
                            usuario_whatsapp,
                            nombre_solicitante,
                            cedula_solicitante,
                            departamento_origen,
                            codigo_costo,
                            punto_venta,
                            tipo_solicitud,
                            tipo_elemento,
                            descripcion,
                            cantidad,
                            observaciones
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [
                            ctx.from,
                            datos.nombre,
                            datos.cedula,
                            'Logística',
                            datos.codigo_costo,
                            datos.punto_venta,
                            datos.tipo_solicitud,
                            datos.tipo_elemento,
                            datos.descripcion,
                            datos.cantidad,
                            datos.observaciones
                        ]
                    );
                } else if (departamento_destino === 'RRHH') {
                    await pool.query(
                        `INSERT INTO requisiciones_rrhh (
                            usuario_whatsapp,
                            nombre_solicitante,
                            cedula_solicitante,
                            departamento_origen,
                            codigo_costo,
                            punto_venta,
                            tipo_solicitud,
                            tipo_elemento,
                            descripcion,
                            cantidad,
                            observaciones
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [
                            ctx.from,
                            datos.nombre,
                            datos.cedula,
                            'RRHH',
                            datos.codigo_costo,
                            datos.punto_venta,
                            datos.tipo_solicitud,
                            datos.tipo_elemento,
                            datos.descripcion,
                            datos.cantidad,
                            datos.observaciones
                        ]
                    );
                } else if (departamento_destino === 'Tic') {
                    await pool.query(
                        `INSERT INTO requisiciones_tic (
                            usuario_whatsapp,
                            nombre_solicitante,
                            cedula_solicitante,
                            'departamento_origen',
                            codigo_costo,
                            punto_venta,
                            tipo_solicitud,
                            tipo_elemento,
                            descripcion,
                            cantidad,
                            observaciones
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [
                            ctx.from,
                            datos.nombre,
                            datos.cedula,
                            'Tic',
                            datos.codigo_costo,
                            datos.punto_venta,
                            datos.tipo_solicitud,
                            datos.tipo_elemento,
                            datos.descripcion,
                            datos.cantidad,
                            datos.observaciones
                        ]
                    );
                } else if (departamento_destino === 'Comercial') {
                    await pool.query(
                        `INSERT INTO requisiciones_comercial (
                            usuario_whatsapp,
                            nombre_solicitante,
                            cedula_solicitante,
                            'departamento_origen',
                            codigo_costo,
                            punto_venta,
                            tipo_solicitud,
                            tipo_elemento,
                            descripcion,
                            cantidad,
                            observaciones
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [
                            ctx.from,
                            datos.nombre,
                            datos.cedula,
                            'Comercial',
                            datos.codigo_costo,
                            datos.punto_venta,
                            datos.tipo_solicitud,
                            datos.tipo_elemento,
                            datos.descripcion,
                            datos.cantidad,
                            datos.observaciones
                        ]
                    );
                }

                await flowDynamic("✅ Solicitud guardada exitosamente");

            } catch (error) {
                console.error("Error al guardar:", error);
                await flowDynamic("❌ Error al guardar la requisición. Intenta nuevamente.");
            }

            // Finalizar y dar opción de volver a crear una requisición o volver al menú
            await flowDynamic([
                {
                    body: '¿Qué deseas hacer ahora?',
                    buttons: [
                        { body: '📝 Nueva requisición' },
                        { body: '🏠 Menú principal' }
                    ]
                }
            ]);
        }
    )
    .addAction(
        { capture: true },
        async (ctx, { gotoFlow }) => {
            if (ctx.body.includes('Nueva') || ctx.body.includes('📝')) {
                return gotoFlow(RequisicionSolicitud);
            }
            const { mainFlow } = await import('../mainFlow');
            return gotoFlow(mainFlow);
        }
    );
