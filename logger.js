const { createLogger, transports, format } = require('winston');
const { combine, timestamp, printf, colorize } = format;

const logger = createLogger({
    level: 'info',
    format: combine(
        colorize(),
        timestamp(),
        printf(({ timestamp, level, message }) => `[${timestamp}] ${level} ${message}`)
    ),
    transports: [
        new transports.Console()
    ]
});
module.exports = logger;