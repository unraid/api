export const isUnraidApiRunning = async (): Promise<boolean | undefined> => {
    const { PM2_HOME } = await import('@app/environment.js');

    // Set PM2_HOME if not already set
    if (!process.env.PM2_HOME) {
        process.env.PM2_HOME = PM2_HOME;
    }

    const { connect, describe, disconnect, list } = await import('pm2');
    return new Promise((resolve) => {
        connect(function (err) {
            if (err) {
                // Don't reject here, resolve with false since we can't connect to PM2
                resolve(false);
                return;
            }

            // First list all processes to debug
            list(function (listErr, processDescriptionList) {
                if (!listErr && processDescriptionList) {
                    // Log all running PM2 processes for debugging
                    const processNames = processDescriptionList.map((p) => p.name);
                    if (processNames.length > 0) {
                        console.debug('PM2 processes found:', processNames);
                    }
                }

                // Now try to describe unraid-api specifically
                describe('unraid-api', function (err, processDescription) {
                    if (err || processDescription.length === 0) {
                        // Service not found or error occurred
                        resolve(false);
                    } else {
                        const isOnline = processDescription?.[0]?.pm2_env?.status === 'online';
                        resolve(isOnline);
                    }

                    disconnect();
                });
            });
        });
    });
};
