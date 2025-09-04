import { TestInfo } from "@playwright/test";
import { TestLogger } from "./logger";

type Report = {
  type: "info" | "warning" | "error";
  description: string;
  data?: Record<string, any>;
};

export function report(testInfo: TestInfo, message: Report, logger?: TestLogger) {
  const logMessage = `Report: ${message.description}`;
  
  if (logger) {
    switch (message.type) {
      case "error":
        logger.error(logMessage, message.data);
        break;
      case "warning":
        logger.warn(logMessage, message.data);
        break;
      case "info":
      default:
        logger.info(logMessage, message.data);
        break;
    }
  } else {
    console.log(`[${message.type.toUpperCase()}]`, logMessage, message.data || '');
  }
}

export function reportAndAnnotate(testInfo: TestInfo, message: Report, logger?: TestLogger) {
  report(testInfo, message, logger);
  testInfo.annotations.push(message);
}
