import { envConfig } from "#configs/index";
import { LOG_LEVELS, ENVIRONMENTS } from "#constants/index";
const pino = require("pino");
const pinoExpress = require("express-pino-logger");

const level = envConfig.ENV === ENVIRONMENTS.PRODUCTION ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;
const prettyPrint = {
	colorize: "true", 
	levelFirst: true, 
	translateTime: "SYS:standard", 
	ignore: "pid,hostname,module" 
};

export const logger = pino({
	name: "server",
	level: level || LOG_LEVELS.DEBUG,
	formatters: {
		level(label) {
			return { level: label };
		}
	},
	prettyPrint: envConfig.ENV === ENVIRONMENTS.PRODUCTION ? false : prettyPrint
});

export const expressLogger = pinoExpress({
	name: "express",
	level: level || LOG_LEVELS.INFO,
	formatters: {
		level(label) {
			return { level: label };
		}
	},
	serializers: {
		res: res => ({
			status: res.statusCode
		}),
		req: req => ({
			method: req.method,
			url: req.url
		})
	},
	prettyPrint: envConfig.ENV === ENVIRONMENTS.PRODUCTION ? false : prettyPrint
});
