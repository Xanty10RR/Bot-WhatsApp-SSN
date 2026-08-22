import { config } from './config';
import { getBot } from './bot';

const main = async () => {
    const { httpServer } = await getBot();

    const port = Number(config.PORT || 3001);

    httpServer(port);

    console.log(`✅ Bot corriendo en http://localhost:${port}`);
};

main().catch(console.error);