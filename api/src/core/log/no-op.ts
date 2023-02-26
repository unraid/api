import { getLogger, type Logger } from 'log4js';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noOp = () => {};

export const getNoOpLogger = (name: string): Logger => {
	const logger = getLogger(name);
	return {
		category: name,
		level: logger.level,
		log: noOp,
		_log: noOp,
		isLevelEnabled: logger.isLevelEnabled,
		isTraceEnabled: logger.isTraceEnabled,
		isDebugEnabled: logger.isDebugEnabled,
		isInfoEnabled: logger.isInfoEnabled,
		isWarnEnabled: logger.isWarnEnabled,
		isErrorEnabled: logger.isErrorEnabled,
		isFatalEnabled: logger.isFatalEnabled,
		addContext: noOp,
		removeContext: noOp,
		clearContext: noOp,
		setParseCallStackFunction: noOp,
		trace: noOp,
		debug: noOp,
		info: noOp,
		warn: noOp,
		error: noOp,
		fatal: noOp,
		mark: noOp,
	} as unknown as Logger;
};