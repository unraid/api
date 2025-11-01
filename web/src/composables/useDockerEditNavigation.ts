import { featureFlags } from '@/helpers/env';

import type { DockerContainer } from '@/composables/gql/graphql';

export function useDockerEditNavigation() {
  function navigateToEditPage(container: DockerContainer | undefined, containerName?: string) {
    if (!featureFlags.DOCKER_EDIT_PAGE_NAVIGATION) {
      return false;
    }

    const name = containerName || (container?.names?.[0] || '').replace(/^\//, '');
    const templatePath = container?.templatePath;

    if (!name || !templatePath) {
      return false;
    }

    const currentPath = window.location.pathname;
    const basePath = currentPath.substring(
      0,
      currentPath.indexOf('?') === -1 ? currentPath.length : currentPath.indexOf('?')
    );
    window.location.href = `${basePath}/UpdateContainer?xmlTemplate=edit:${encodeURIComponent(templatePath)}`;
    return true;
  }

  return {
    navigateToEditPage,
  };
}
