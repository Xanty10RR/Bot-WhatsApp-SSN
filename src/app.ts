import { config } from './config';
import { getBot } from './bot';
import { pool } from './provider/database';

const keepDatabaseAlive = () => {
    setInterval(async () => {
        try {
            await pool.query('SELECT 1');
            console.log(
                'Ping a Supabase OK:',
                new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
            );
        } catch (error) {
            console.error('❌ Ping a Supabase falló:', error);
        }
    }, 1000 * 60 * 60 * 24 * 2);
};

const main = async () => {
    keepDatabaseAlive();

    const { httpServer } = await getBot();

    const port = Number(config.PORT || 3001);

    httpServer(port);

    console.log(`✅ Bot corriendo en http://localhost:${port}`);
};

main().catch(console.error);