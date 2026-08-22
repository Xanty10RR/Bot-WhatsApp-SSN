import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    console.log("🔥 WEBHOOK VERCEL:", req.method, req.url);

    return res.status(200).json({
        ok: true,
        source: "api/webhook.ts",
        message: "ESTE ES EL WEBHOOK DE VERCEL",
        method: req.method,
        query: req.query,
    });
}