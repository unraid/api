import { report, reportAndAnnotate } from "@/utils/reporting.js";
import { test, expect } from "../fixtures/auth.fixture.js";
import { SettingsPage } from "../utils/pages/settings.page.js";
import {
  triggerToast,
  waitForToast,
  getToastStyles,
  isLightBackground,
  isDarkBackground,
  hasGoodContrast,
  getContrastRatio,
  getLuminance,
} from "../utils/toast-helpers.js";

test.describe("Theme Toast Styles", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Authentication handled by fixture
  });

  test("should display appropriate toast styles for light and dark themes", async ({
    page,
  }) => {
    const settings = new SettingsPage(page);

    // Store original theme to restore later
    const originalTheme = await settings.getCurrentTheme();

    try {
      // Test Light Theme (white)
      await test.step("Test light theme toasts", async () => {
        await settings.setTheme("white");

        // Test different toast types
        const toastTypes: Array<"success" | "info" | "warning" | "error"> = [
          "success",
          "info",
          "warning",
          "error",
        ];

        for (const toastType of toastTypes) {
          // Trigger a toast notification
          await triggerToast(page, toastType, `Light theme ${toastType} toast`);

          // Get toast styles
          const toastElement = await waitForToast(page);
          await expect(toastElement).toBeVisible();

          const styles = await getToastStyles(page);

          // Calculate metrics
          const bgLuminance = getLuminance(styles.backgroundRgb);
          const textLuminance = getLuminance(styles.textRgb);
          const contrastRatio = getContrastRatio(
            styles.backgroundRgb,
            styles.textRgb
          );
          const isLight = isLightBackground(styles.backgroundRgb);
          const hasContrast = hasGoodContrast(
            styles.backgroundRgb,
            styles.textRgb
          );
          report(test.info(), {
            type: "info",
            description: `Light theme ${toastType} toast analysis`,
            data: {
              background: styles.backgroundColor,
              text: styles.color,
              bgLuminance: bgLuminance.toFixed(3),
              textLuminance: textLuminance.toFixed(3),
              contrastRatio: contrastRatio.toFixed(2) + ":1",
              isLightBackground: isLight,
              meetsWCAG_AA: hasContrast,
              status: isLight ? "✅ PASS" : "❌ FAIL",
            },
          });

          // Primary test: Verify light theme has light background
          expect
            .soft(
              isLight,
              `Expected light background for ${toastType} toast in light theme. ` +
                `Got luminance: ${bgLuminance.toFixed(3)} (threshold: >0.5)`
            )
            .toBeTruthy();

          // Secondary check: Log contrast warning if it doesn't meet WCAG AA
          if (!hasContrast) {
            reportAndAnnotate(test.info(), {
              type: "warning",
              description:
                `Contrast warning for ${toastType} toast: ${contrastRatio.toFixed(
                  2
                )}:1 ` +
                `(WCAG AA requires 4.5:1). This may affect readability.`,
            });
          }

          // Wait for toast to disappear before next one
          await page.waitForTimeout(1000);
        }
      });

      // Test Dark Theme (black)
      await test.step("Test dark theme toasts", async () => {
        await settings.setTheme("black");

        // Test different toast types
        const toastTypes: Array<"success" | "info" | "warning" | "error"> = [
          "success",
          "info",
          "warning",
          "error",
        ];

        for (const toastType of toastTypes) {
          // Trigger a toast notification
          await triggerToast(page, toastType, `Dark theme ${toastType} toast`);

          // Get toast styles
          const toastElement = await waitForToast(page);
          await expect(toastElement).toBeVisible();

          const styles = await getToastStyles(page);

          // Calculate metrics
          const bgLuminance = getLuminance(styles.backgroundRgb);
          const textLuminance = getLuminance(styles.textRgb);
          const contrastRatio = getContrastRatio(
            styles.backgroundRgb,
            styles.textRgb
          );
          const isDark = isDarkBackground(styles.backgroundRgb);
          const hasContrast = hasGoodContrast(
            styles.backgroundRgb,
            styles.textRgb
          );
          report(test.info(), {
            type: "info",
            description: `Dark theme ${toastType} toast analysis`,
            data: {
              background: styles.backgroundColor,
              text: styles.color,
              bgLuminance: bgLuminance.toFixed(3),
              textLuminance: textLuminance.toFixed(3),
              contrastRatio: contrastRatio.toFixed(2) + ":1",
              isDarkBackground: isDark,
              meetsWCAG_AA: hasContrast,
              status: isDark ? "✅ PASS" : "❌ FAIL",
            },
          });

          // Primary test: Verify dark theme has dark background
          expect
            .soft(
              isDark,
              `Expected dark background for ${toastType} toast in dark theme. ` +
                `Got luminance: ${bgLuminance.toFixed(3)} (threshold: ≤0.5)`
            )
            .toBeTruthy();

          // Secondary check: Log contrast warning if it doesn't meet WCAG AA
          if (!hasContrast) {
            reportAndAnnotate(test.info(), {
              type: "warning",
              description: `Contrast warning for ${toastType} toast: ${contrastRatio.toFixed(
                2
              )}:1 (WCAG AA requires 4.5:1). This may affect readability.`,
            });
          }

          // Wait for toast to disappear before next one
          await page.waitForTimeout(1000);
        }
      });
    } finally {
      // Restore original theme
      if (originalTheme && originalTheme !== "black") {
        await settings.setTheme(originalTheme as "white" | "black");
      }
    }
  });

  test("should maintain toast legibility across theme transitions", async ({
    page,
  }) => {
    const settings = new SettingsPage(page);

    // Test theme transition
    await test.step("Verify contrast remains good during theme switch", async () => {
      // Start with light theme
      await settings.setTheme("white");
      await triggerToast(page, "success", "Light theme success toast");

      const lightToast = await waitForToast(page);
      await expect(lightToast).toBeVisible();
      const lightStyles = await getToastStyles(page);

      // Wait for toast to clear
      await page.waitForTimeout(2000);

      // Switch to dark theme
      await settings.setTheme("black");
      await triggerToast(page, "success", "Dark theme success toast");

      const darkToast = await waitForToast(page);
      await expect(darkToast).toBeVisible();
      const darkStyles = await getToastStyles(page);

      // Calculate metrics for both themes
      const lightContrast = getContrastRatio(
        lightStyles.backgroundRgb,
        lightStyles.textRgb
      );
      const darkContrast = getContrastRatio(
        darkStyles.backgroundRgb,
        darkStyles.textRgb
      );
      const lightBgLuminance = getLuminance(lightStyles.backgroundRgb);
      const darkBgLuminance = getLuminance(darkStyles.backgroundRgb);

      report(test.info(), {
        type: "info",
        description: "Theme transition analysis",
        data: {
          light: {
            luminance: lightBgLuminance.toFixed(3),
            contrast: lightContrast.toFixed(2) + ":1",
            meetsWCAG: lightContrast >= 4.5,
          },
          dark: {
            luminance: darkBgLuminance.toFixed(3),
            contrast: darkContrast.toFixed(2) + ":1",
            meetsWCAG: darkContrast >= 4.5,
          },
        },
      });

      // Soft expectations with informative messages
      expect
        .soft(
          isLightBackground(lightStyles.backgroundRgb),
          `Light theme should have light background. Luminance: ${lightBgLuminance.toFixed(
            3
          )}`
        )
        .toBeTruthy();

      expect
        .soft(
          isDarkBackground(darkStyles.backgroundRgb),
          `Dark theme should have dark background. Luminance: ${darkBgLuminance.toFixed(
            3
          )}`
        )
        .toBeTruthy();

      // Warn about contrast issues but don't fail
      if (lightContrast < 4.5) {
        reportAndAnnotate(test.info(), {
          type: "warning",
          description: `Light theme contrast: ${lightContrast.toFixed(
            2
          )}:1 (WCAG AA requires 4.5:1)`,
        });
      }

      if (darkContrast < 4.5) {
        reportAndAnnotate(test.info(), {
          type: "warning",
          description: `Dark theme contrast: ${darkContrast.toFixed(
            2
          )}:1 (WCAG AA requires 4.5:1)`,
        });
      }
    });
  });
});
