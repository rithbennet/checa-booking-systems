import "server-only";
import pino, { type Logger } from "pino";

const isDevelopment = process.env.NODE_ENV === "development";
const isEdge = process.env.NEXT_RUNTIME === "edge";

export const logger = pino({
	level: process.env.LOG_LEVEL ?? (isDevelopment ? "debug" : "info"),
	transport:
		isDevelopment && !isEdge
			? {
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "HH:mm:ss Z",
						ignore: "pid,hostname",
					},
				}
			: undefined,
	base: { env: process.env.NODE_ENV },
});

export function createRequestLogger(
	requestId: string,
	userId?: string,
): Logger {
	return logger.child({ requestId, userId });
}
