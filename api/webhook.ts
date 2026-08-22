import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    console.log("🔥 WEBHOOK VERCEL:", req.method, req.url);

    return res.status(200).json({
        ok: true,
        message: "Webhook de Vercel funcionando",
        method: req.method,
    });
}