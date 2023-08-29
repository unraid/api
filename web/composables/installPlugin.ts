const useInstallPlugin = () => {
  const install = (payload = { staging: false, update: false }) => {
    try {
      const file = `https://sfo2.digitaloceanspaces.com/unraid-dl/unraid-api/dynamix.unraid.net${payload?.staging ? '.staging.plg' : '.plg'}`;

      if (!payload.update) {
        // after initial install, the dropdown store looks for this to automatically open the launchpad dropdown
        sessionStorage.setItem('clickedInstallPlugin', '1');
      }
      const modalTitle = payload.update ? 'Updating Connect (beta)' : 'Installing Connect (beta)';

      // @ts-ignore – `openPlugin` will be included in 6.10.4+ DefaultPageLayout
      if (typeof openPlugin === 'function') {

        // @ts-ignore
        openPlugin(
          `plugin ${payload.update ? 'update' : 'install'} ${file}`,
          modalTitle,
          '',
          'refresh',
        );
      } else {
        // `openBox()` is defined in the webgui's DefaultPageLayout.php and used when openPlugin is not available

        // @ts-ignore
        openBox(
          `/plugins/dynamix.plugin.manager/scripts/plugin&arg1=install&arg2=${file}`,
          modalTitle,
          600,
          900,
          true,
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  return {
    install,
  };
};

export default useInstallPlugin;
