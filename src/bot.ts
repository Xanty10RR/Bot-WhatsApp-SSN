import { createBot, MemoryDB } from '@builderbot/bot';
import { provider } from './provider';
import templates from './templates';
import './provider/database';

let botPromise: ReturnType<typeof createBot> | undefined;

export const getBot = () => {
    botPromise ??= createBot({
        flow: templates,
        provider,
        database: new MemoryDB(),
    });

    return botPromise;
};