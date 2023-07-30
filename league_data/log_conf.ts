import winston, { format, transports } from 'winston';

// Create a transport for writing to the file
const fileTransport = new transports.File({
  level: 'info', // Log 'info' and above to file
  filename: `app.log`,
  format: format.printf(info => {
    return `${info.timestamp} - ${info.level.toUpperCase()} - ${info.message}`;
  }),
  maxsize: 1048576, // max size of 1MB
});

// Create a transport for logging to the console
const consoleTransport = new transports.Console({
  level: 'warn', // Only log 'warn' and above to console
  format: format.printf(info => {
    return `${info.timestamp} - ${info.level.toUpperCase()} - ${info.message}`;
  }),
});

// Create a logger instance
const logger = winston.createLogger({
  level: 'info', // Global logging level
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  transports: [
    fileTransport,
    consoleTransport,
  ],
});

export default logger;
