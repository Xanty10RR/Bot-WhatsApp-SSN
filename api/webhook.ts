declare const process: any;

export default async function handler(req: any, res: any) {
    // Meta envía una petición GET para verificar el token
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        // Comprobamos si el token coincide con 'password'
        if (mode && token) {
            if (mode === 'subscribe' && (token === process.env.verifyToken || token === 'password')) {
                console.log('WEBHOOK_VERIFIED');
                return res.status(200).send(challenge);
            } else {
                return res.status(403).send('Token incorrecto');
            }
        }
        return res.status(400).send('Faltan parámetros');
    }

    // Si es POST (mensajes entrantes), aquí pondríamos el bot después
    return res.status(200).send('OK');
}