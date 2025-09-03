import { TestInfo } from "@playwright/test";

type Report = {
  type: "info" | "warning" | "error";
  description: string;
  data?: Record<string, any>;
};

export function report(testInfo: TestInfo, message: Report) {
  console.log(testInfo.titlePath.join(" > "), message);
}

export function reportAndAnnotate(testInfo: TestInfo, message: Report) {
  report(testInfo, message);
  testInfo.annotations.push(message);
}
