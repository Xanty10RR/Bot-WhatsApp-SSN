import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    console.log("🔥🔥🔥 ESTOY EN api/webhook.ts 🔥🔥🔥");
    console.log("METHOD:", req.method);
    console.log("URL:", req.url);
    console.log("QUERY:", req.query);

    return res.status(200).json({
        prueba: "FUNCIONA",
        archivo: "api/webhook.ts",
        metodo: req.method,
        query: req.query,
    });
}