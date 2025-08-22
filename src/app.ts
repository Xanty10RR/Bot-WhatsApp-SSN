import { createBot } from '@builderbot/bot';
import { MemoryDB } from '@builderbot/bot';
import { provider } from './provider';
import { config } from './config';
import templates from './templates';

const main = async () => {
    const { httpServer } = await createBot({
        flow: templates,
        provider: provider,
        database: new MemoryDB(),
    });

    const port = Number(config.PORT || 3001);
    httpServer(port); // levanta el servidor interno de Builderbot

    console.log(`✅ Bot corriendo en http://localhost:${port}`);
};

main().catch(console.error);
