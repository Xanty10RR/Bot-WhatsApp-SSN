import "dotenv/config";

export const config = { 
    PORT: process.env.PORT ?? 3001,
    HOST: process.env.HOST ?? '0.0.0.0',
    //META
    jwtToken: process.env.jwtToken,
    numberId: process.env.numberId,
    verifyToken: process.env.verifyToken,
    version: 'v22.0'
};