import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    console.log("🔥 WEBHOOK:", req.method);
    console.log("QUERY:", req.query);

    // Verificación de Meta
    if (req.method === "GET") {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        console.log("MODE:", mode);
        console.log("TOKEN RECIBIDO:", token ? "SI" : "NO");
        console.log("CHALLENGE:", challenge);

        if (
            mode === "subscribe" &&
            token === process.env.verifyToken
        ) {
            console.log("✅ TOKEN CORRECTO");

            return res.status(200).send(challenge);
        }

        console.log("❌ TOKEN INCORRECTO");

        return res.status(403).send("Token incorrecto o parámetros inválidos");
    }

    // Aquí posteriormente recibiremos los mensajes de WhatsApp
    if (req.method === "POST") {
        console.log("📩 WEBHOOK POST:", req.body);

        return res.status(200).json({
            ok: true,
            message: "Webhook POST recibido"
        });
    }

    return res.status(405).json({
        ok: false,
        message: "Método no permitido"
    });
}