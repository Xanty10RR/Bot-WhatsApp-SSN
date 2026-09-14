import { addKeyword, EVENTS } from "@builderbot/bot";
import { MENU_IDS } from "./constants";
import { createClient } from "@supabase/supabase-js";
import { registrarErrorApi } from "../utils/registroFallosApi";

// Inicializar Supabase con tu llave correcta del .env
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

// Función para registrar en Supabase con logs en consola
const registrarInteraccionBot = async (
  telefono: string,
  nombre: string,
  accion: string,
) => {
  try {
    console.log(
      `[DEBUG] Intentando registrar sesión para el número: ${telefono}`,
    );

    const { data: existingUser } = await supabase
      .from("sesiones_chat")
      .select("total_mensajes")
      .eq("telefono", telefono)
      .single();

    const nuevoTotal = existingUser ? existingUser.total_mensajes + 1 : 1;

    const { error } = await supabase.from("sesiones_chat").upsert(
      {
        telefono: telefono,
        nombre: nombre || "Usuario WhatsApp",
        ultimo_mensaje: new Date(),
        total_mensajes: nuevoTotal,
        ultima_accion: accion,
      },
      { onConflict: "telefono" },
    );

    if (error) {
      console.error("❌ SUPABASE RECHAZÓ EL REGISTRO:", error.message);
    } else {
      console.log(
        "✅ ¡Sesión guardada/actualizada con éxito en tabla sesiones_chat!",
      );
    }

    // Inserta una nueva fila en tabla total_historico_usuarios (para contador acumulativo de usuarios nuevos o recurrentes)
    const { error: errorHistorico } = await supabase
      .from("total_historico_usuarios")
      .insert({
        telefono: telefono,
        nombre: nombre || "Usuario WhatsApp",
        fecha: new Date(),
      });

    if (errorHistorico) {
      console.error(
        "❌ SUPABASE RECHAZÓ EL REGISTRO EN total_historico_usuarios:",
        errorHistorico.message,
      );
    } else {
      console.log("✅ ¡Registrado en total_historico_usuarios (+1)!");
    }
  } catch (err) {
    console.error("❌ ERROR CRÍTICO EN LA FUNCIÓN:", err);
    // Cambiamos 'ctx.from' por 'telefono'
    await registrarErrorApi(err, "mainFlow", telefono);
  }
};

const mainFlow = addKeyword([
  "hola",
  "Hola",
  "inicio",
  "Menu",
  "menu",
  EVENTS.WELCOME,
]).addAction(async (ctx, { provider }) => {
  // Este log debe aparecer en tu terminal apenas escribas en WhatsApp
  console.log("🔥 ¡Mensaje recibido de:", ctx.from);

  // Llamamos a la función de registro
  await registrarInteraccionBot(
    ctx.from,
    ctx.pushName,
    "Inició conversación (Menú Principal)",
  );

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
      button: "Ver opciones",
      sections: [
        {
          title: "Ayuda y Servicios",
          rows: [
            {
              id: MENU_IDS.PRINCIPAL.OPCION1,
              title: "🔍 Consultar convenio",
              description:
                "Solicita información de convenio, instrucciones de pago",
            },
            {
              id: MENU_IDS.PRINCIPAL.OPCION3,
              title: "📋 Hacer requisición",
              description: "Solicita activos, insumos, repuestos, servicios...",
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
    await registrarErrorApi(error, "mainFlow", ctx.from);
  }
});

export { mainFlow };
