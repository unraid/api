export interface InstallPluginPayload {
  modalTitle: string;
  pluginUrl: string;
  update?: boolean;
}

const useInstallPlugin = () => {
  const install = (payload: InstallPluginPayload) => {
    try {
      // @ts-ignore – `openPlugin` will be included in 6.10.4+ DefaultPageLayout
      if (typeof openPlugin === 'function') {
        // @ts-ignore
        openPlugin(
          `plugin ${payload.update ? 'update' : 'install'} ${payload.pluginUrl}`,
          payload.modalTitle,
          '',
          'refresh',
        );
      } else {
        // `openBox()` is defined in the webgui's DefaultPageLayout.php and used when openPlugin is not available
        // @ts-ignore
        openBox(
          `/plugins/dynamix.plugin.manager/scripts/plugin&arg1=install&arg2=${payload.pluginUrl}`,
          payload.modalTitle,
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
