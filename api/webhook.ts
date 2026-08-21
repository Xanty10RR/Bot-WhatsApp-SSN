declare const process: any;

export default async function handler(req: any, res: any) {
    // Meta envía una petición GET para verificar el token
    if (req.method === 'GET') {
        const query = req.query ?? {};
        const mode = Array.isArray(query['hub.mode'])
            ? query['hub.mode'][0]
            : query['hub.mode'];
        const token = Array.isArray(query['hub.verify_token'])
            ? query['hub.verify_token'][0]
            : query['hub.verify_token'];
        const challenge = Array.isArray(query['hub.challenge'])
            ? query['hub.challenge'][0]
            : query['hub.challenge'];
        // Usa el mismo valor configurado en Meta (sin espacios).
        const verifyToken = String(
            process.env.VERIFY_TOKEN ?? process.env.verifyToken ?? ''
        ).trim();

        if (mode === 'subscribe' && token && verifyToken && token === verifyToken) {
            console.log('WEBHOOK_VERIFIED');
            return res.status(200).send(challenge);
        }

        return res.status(403).send('Token incorrecto o parámetros inválidos');
    }

    // Si es POST (mensajes entrantes), aquí pondríamos el bot después
    return res.status(200).send('OK');
}