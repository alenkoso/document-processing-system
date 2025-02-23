import winston from 'winston';

export const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.json(),
    defaultMeta: { service: 'document-qa' },
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        })
    ]
}); 