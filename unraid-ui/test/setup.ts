/// <reference types="vitest/globals" />
import { config } from "@vue/test-utils";
import { cleanup } from "@testing-library/vue";

// Setup Vue Test Utils global config
config.global.stubs = {};

afterEach(() => {
  cleanup();
});
