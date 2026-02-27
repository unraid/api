# Onboarding Internal Boot Port: Non-1:1 Differences

This list tracks behavior that is intentionally or currently different from the webgui implementation in commit `edff0e5202c0efeaa613efb8dfc599453d0fe5cb`.

## Current Differences

- Data source for setup context:
  - Webgui: `Main/PoolDevices`/websocket-rendered context + `devs.ini`-based behavior.
  - Onboarding: existing GraphQL (`array`, `vars`, `shares`, `disks`).

- Device option labeling:
  - Webgui formats labels via PHP helpers.
  - Onboarding formats labels in Vue (`<id> - <size> (<device>)`).

- Pool/share name validation parity is close but not exact:
  - Onboarding enforces regex, share-name collision, and existing cache pool-name collision.
  - Full webgui reserved-name and collision checks are not fully mirrored yet.

- Dialog auto-open via URL flag:
  - Webgui supports `?createbootpool`.
  - Onboarding step does not support URL-triggered auto-open.

- Reboot flow:
  - Webgui dialog path is "Activate and Reboot" in one flow.
  - Onboarding applies `mkbootpool` without reboot in summary, then exposes reboot as a separate next-step action.

- Existing internal-boot detection for step visibility:
  - Webgui has direct page-level context for its own surfaces.
  - Onboarding currently gates by user type and setup context, but does not yet hide the step based on "already on internal boot" detection.
