export const isUnraidApiRunning = async (): Promise<boolean | undefined> => {
    const { PM2_HOME } = await import('@app/environment.js');

    // Set PM2_HOME if not already set
    if (!process.env.PM2_HOME) {
        process.env.PM2_HOME = PM2_HOME;
    }

    const { connect, describe, disconnect } = await import('pm2');
    return new Promise((resolve) => {
        connect(function (err) {
            if (err) {
                // Don't reject here, resolve with false since we can't connect to PM2
                resolve(false);
                return;
            }

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
};
