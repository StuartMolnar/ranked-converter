import winston, { format, transports } from 'winston';
import yaml from 'js-yaml';
import fs from 'fs';

function loadConfig(file: string): any {
    try {
        const configFile = fs.readFileSync(file, 'utf8');
        return yaml.load(configFile);
    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Failed to load configuration from ${file}: ${error.message}`);
        } else {
            logger.error(`Failed to load configuration from ${file}: ${error}`);
        }
        throw error;
    }
}

const config = loadConfig('app_conf.yml');


const fileTransport = new transports.File({
  level: config.LOGGING.LEVEL,
  filename: config.LOGGING.FILE_NAME,
  format: format.printf(info => {
    return `${info.timestamp} - ${info.level.toUpperCase()} - ${info.message}`;
  }),
  maxsize: config.LOGGING.MAX_FILE_SIZE,
});

const consoleTransport = new transports.Console({
  level: config.LOGGING.LEVEL,
  format: format.printf(info => {
    return `${info.timestamp} - ${info.level.toUpperCase()} - ${info.message}`;
  }),
});

const logger = winston.createLogger({
  level: config.LOGGING.LEVEL,
  format: format.combine(
    format.timestamp({
      format: config.LOGGING.TIMESTAMP_FORMAT,
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
