import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL!, 
    process.env.SUPABASE_ANON_KEY!
);

// Registra un error de API's o del bot en la tabla (errores_api)
// Reemplazar esto con la URL real de tu servidor de métricas en Render o localhost en desarrollo

const METRICS_SERVER_URL = process.env.METRICS_SERVER_URL || 'http://localhost:3003';

export const registrarErrorApi = async (error: any, origen: string, telefono?: string) => {
    try {
        const mensajeError = error?.message || String(error) || 'Error desconocido';

        await fetch(`${METRICS_SERVER_URL}/api/chatbot/log-error`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mensaje: mensajeError,
                origen: origen,
                telefono: telefono || null
            })
        });

        console.log(`⚠️ Error reportado al servidor de métricas [Origen: ${origen}]`);
    } catch (err) {
        // Si por alguna razón el servidor de métricas no responde, el bot no se rompe
        console.error('❌ Falló al intentar enviar el error al servidor de métricas:', err);
    }
};