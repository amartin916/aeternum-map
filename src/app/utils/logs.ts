/**
 * Overwolf log files only contain strings. Thus, it's required to stringify objects.
 * console.error is synchron which might block or slow down the UI. To prevent this, the logs are written asynchronous.
 */

type Logger = (message?: unknown, ...optionalParams: unknown[]) => void;

function log(logger: Logger) {
  return (...data: unknown[]) => {
    setTimeout(() => logger(...data.map((item) => JSON.stringify(item))), 1);
  };
}

export const writeLog = log(console.log);
export const writeError = log(console.error);
export const writeInfo = log(console.info);
export const writeWarn = log(console.warn);