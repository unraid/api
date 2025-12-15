import { featureFlags } from '@/helpers/env';
import { navigate } from '@/helpers/external-navigation';

import type { DockerContainer } from '@/composables/gql/graphql';

function buildLegacyEditUrl(templatePath: string) {
  if (typeof window === 'undefined') return null;
  const currentPath = window.location.pathname;
  const basePath = currentPath.substring(
    0,
    currentPath.indexOf('?') === -1 ? currentPath.length : currentPath.indexOf('?')
  );
  const searchParams = new URLSearchParams({
    xmlTemplate: `edit:${templatePath}`,
    iframe: 'true',
  });
  return `${basePath}/UpdateContainer?${searchParams.toString()}`;
}

export function useDockerEditNavigation() {
  const shouldUseLegacyEditPage = featureFlags.DOCKER_EDIT_PAGE_NAVIGATION;

  function getLegacyEditUrl(container: DockerContainer | undefined, containerName?: string) {
    if (!shouldUseLegacyEditPage) {
      return null;
    }

    const name = containerName || (container?.names?.[0] || '').replace(/^\//, '');
    const templatePath = container?.templatePath;

    if (!name || !templatePath) {
      return null;
    }

    return buildLegacyEditUrl(templatePath);
  }

  function navigateToEditPage(container: DockerContainer | undefined, containerName?: string) {
    const url = getLegacyEditUrl(container, containerName);
    if (!url) {
      return false;
    }
    navigate(url);
    return true;
  }

  return {
    getLegacyEditUrl,
    navigateToEditPage,
    shouldUseLegacyEditPage,
  };
}
