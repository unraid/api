const defaultErrorHandler = (error: Error) => {
    console.error(error);
};

const getScriptArgs = (process: NodeJS.Process) => {
    if (!process || typeof process !== 'object' || !Array.isArray(process.argv)) return [];

    const [, , ...params] = process.argv;
    return params;
};

const setExitCode = (process: NodeJS.Process, code = 1) => {
    if (process && typeof process === 'object' && process.exitCode !== code) {
        process.exitCode = code;
    }
};

const handleError = async (mainError: Error, errorHandler: (error: Error) => Promise<void> | void) => {
    setExitCode(process, 1);
    if (errorHandler === defaultErrorHandler) return defaultErrorHandler(mainError);

    try {
        await errorHandler(mainError);
    } catch (errorHandlerFailure) {
        console.warn(`The custom error handler failed`, errorHandlerFailure);
        defaultErrorHandler(mainError);
    }
};

type RegisterUnhandledRejectionHandler = {
    (process: NodeJS.Process): void;
    done?: boolean;
};

const registerUnhandledRejectionHandler: RegisterUnhandledRejectionHandler = (
    process: NodeJS.Process
) => {
    if (
        !process ||
        typeof process !== 'object' ||
        typeof process.on !== 'function' ||
        registerUnhandledRejectionHandler.done
    )
        return;

    const amUnhandledRejectionHandler: NodeJS.UnhandledRejectionListener = (error, failedPromise) => {
        setExitCode(process, 2);
        console.warn(`Unhandled Promise Rejection ${error}\n\tat: Promise ${failedPromise}`);
    };

    process.on('unhandledRejection', amUnhandledRejectionHandler);
    registerUnhandledRejectionHandler.done = true;
};

const runMain = async (
    asyncMain: (...args: string[]) => Promise<void> | void,
    errorHandler: (error: Error) => Promise<void> | void,
    process: NodeJS.Process
) => {
    registerUnhandledRejectionHandler(process);
    try {
        return await asyncMain(...getScriptArgs(process));
    } catch (mainError: unknown) {
        await handleError(mainError as Error, errorHandler);
    }
};

export const am = (
    asyncMain: (...args: string[]) => Promise<void> | void,
    errorHandler = defaultErrorHandler
) => runMain(asyncMain, errorHandler, process);
