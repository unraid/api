export interface InstallPluginPayload {
  modalTitle: string;
  pluginUrl: string;
  update?: boolean;
}

const useInstallPlugin = () => {
  const install = (payload: InstallPluginPayload) => {
    console.debug('[installPlugin]', payload);
    try {
      // @ts-expect-error – `openPlugin` will be included in 6.10.4+ DefaultPageLayout
      if (typeof openPlugin === 'function') {
        const plgUrl = new URL(payload.pluginUrl);
        const installString = `${plgUrl.pathname.replace('.plg', '').substring(1)}:install`; // mimic what is done on the install plg page JS but without the regex that's hard to read
        console.debug('[installPlugin]', { installString, plgUrl });
        // @ts-expect-error
        openPlugin(
          `plugin ${payload.update ? 'update' : 'install'} ${payload.pluginUrl}${payload.update ? '' : ' forced'}`, // command – `forced` is used to bypass the strcmp check in the plugin manager script being wrong for OS versions
          payload.modalTitle, // title
          installString, // plg
          'refresh', // function defined in DefaultPageLayout.php
          0, // run command only when not already running (default)
          1, // hide close button
        );
      } else {
        // `openBox()` is defined in the webgui's DefaultPageLayout.php and used when openPlugin is not available
        // @ts-expect-error
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
