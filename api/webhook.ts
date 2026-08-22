import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log("🔥 WEBHOOK:", req.method);
  console.log("QUERY:", req.query);

  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    console.log("MODE:", mode);
    console.log("TOKEN RECIBIDO:", token ? "SI" : "NO");
    console.log("CHALLENGE:", challenge);

    if (mode === "subscribe" && token === process.env.verifyToken) {
      console.log("✅ TOKEN CORRECTO");
      console.log("🎯 CHALLENGE RECIBIDO:", challenge);
      console.log("🎯 RESPUESTA ENVIADA:", String(challenge));

      return res.status(200).send(String(challenge));
    }

    console.log("❌ TOKEN INCORRECTO");

    return res.status(403).send("Token incorrecto o parámetros inválidos");
  }

  if (req.method === "POST") {
    console.log("📩 WEBHOOK POST:", req.body);

    return res.status(200).json({
      ok: true,
      message: "Webhook POST recibido",
    });
  }

  return res.status(405).json({
    ok: false,
    message: "Método no permitido",
  });
}
