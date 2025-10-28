export const devConfig = {
  /** Flag for mocking a user session during development via an unsecure cookie */
  VITE_MOCK_USER_SESSION: String(import.meta.env.VITE_MOCK_USER_SESSION) === 'true',
  NODE_ENV: process.env.NODE_ENV,
};

export const featureFlags = {
  /** Navigate to legacy edit page when clicking docker containers instead of showing compacted view */
  DOCKER_EDIT_PAGE_NAVIGATION: String(import.meta.env.VITE_DOCKER_EDIT_PAGE_NAVIGATION) !== 'false',
};
