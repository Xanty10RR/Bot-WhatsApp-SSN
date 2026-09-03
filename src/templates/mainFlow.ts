import { addKeyword, EVENTS } from "@builderbot/bot";
import { MENU_IDS } from "./constants";
import { createClient } from "@supabase/supabase-js";

// Inicializar Supabase usando el archivo .env
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

// Función que registra o actualiza la sesión y el conteo de mensajes del usuario
const registrarInteraccionBot = async (
  telefono: string,
  nombre: string,
  accion: string,
) => {
  try {
    // Consultar si el usuario ya existe para incrementar su total de mensajes
    const { data: existingUser } = await supabase
      .from("sesiones_chat")
      .select("total_mensajes")
      .eq("telefono", telefono)
      .single();

    const nuevoTotal = existingUser ? existingUser.total_mensajes + 1 : 1;

    // Guardamos o actualizamos en la tabla 'sesiones_chat'
    await supabase.from("sesiones_chat").upsert(
      {
        telefono: telefono,
        nombre: nombre || "Usuario WhatsApp",
        ultimo_mensaje: new Date(),
        total_mensajes: nuevoTotal,
        ultima_accion: accion,
      },
      { onConflict: "telefono" },
    );
  } catch (error) {
    console.error("Error registrando sesión en Supabase:", error);
  }
};

const mainFlow = addKeyword(["inicio", "menu", EVENTS.WELCOME])
  .addAnswer("")
  .addAction(async (ctx, { provider }) => {
    // Registro la sesión en Supabase apenas el usuario escribe
    const telefono = ctx.from;
    const nombre = ctx.pushName || "Usuario WhatsApp";
    await registrarInteraccionBot(
      telefono,
      nombre,
      "Inició conversación (Menú Principal)",
    );
    
    // Estructura limpia y validada para los servidores de Meta
    const list = {
      header: {
        type: "text",
        text: "¡Hola!, 👋 soy el Asistente de SuperGiros",
      },
      body: {
        text: "Estoy aquí las 24h para brindarte una mejor experiencia y ayudarte a consultar *información sobre recaudos de convenios*, *solicitar* y *aprobar requisiciones* de forma rápida.\n¿Qué deseas hacer hoy?, selecciona una opción",
      },
      footer: {
        text: "SUPERSERVICIOS DE NARIÑO S.A",
      },
      action: {
        button: "Ver opciones", // ⚠️ Máximo 20 caracteres
        sections: [
          {
            title: "Ayuda y Servicios",
            rows: [
              {
                id: MENU_IDS.PRINCIPAL.OPCION1,
                title: "🔍 Consultar convenio", // ⚠️ Máximo 24 caracteres
                description:
                  "Solicita información de convenio, instrucciones de pago", // ⚠️ Máximo 72 caracteres
              },
              {
                id: MENU_IDS.PRINCIPAL.OPCION3,
                title: "📋 Hacer requisición",
                description:
                  "Solicita activos, insumos, repuestos, servicios...",
              },
            ],
          },
        ],
      },
    };

    try {
      await provider.sendList(ctx.from, list);
    } catch (error) {
      console.error("Error al enviar la lista:", error);
    }
  });

export { mainFlow };
