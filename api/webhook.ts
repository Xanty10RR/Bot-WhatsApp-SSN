import { createBot } from '@builderbot/bot';
import { MemoryDB } from '@builderbot/bot';
import { provider } from '../src/provider';
import templates from '../src/templates';
import '../src/provider/database';

let botPromise: ReturnType<typeof createBot> | undefined;

const getBot = () => {
    botPromise ??= createBot({
        flow: templates,
        provider: provider,
        database: new MemoryDB(),
    });
    return botPromise;
};

export default async function handler(req: any, res: any) {
    const { httpServer } = await getBot();
    return (httpServer as unknown as (request: any, response: any) => unknown)(req, res);
}