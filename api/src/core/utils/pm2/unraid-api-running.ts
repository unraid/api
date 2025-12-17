export const isUnraidApiRunning = async (): Promise<boolean | undefined> => {
    const { PM2_HOME } = await import('@app/environment.js');

    // Set PM2_HOME if not already set
    if (!process.env.PM2_HOME) {
        process.env.PM2_HOME = PM2_HOME;
    }

    const pm2Module = await import('pm2');
    const pm2 = pm2Module.default || pm2Module;

    const pm2Promise = new Promise<boolean>((resolve) => {
        pm2.connect(function (err) {
            if (err) {
                // Don't reject here, resolve with false since we can't connect to PM2
                resolve(false);
                return;
            }

            // Now try to describe unraid-api specifically
            pm2.describe('unraid-api', function (err, processDescription) {
                if (err || processDescription.length === 0) {
                    // Service not found or error occurred
                    resolve(false);
                } else {
                    const isOnline = processDescription?.[0]?.pm2_env?.status === 'online';
                    resolve(isOnline);
                }

                pm2.disconnect();
            });
        });
    });

    const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), 10000); // 10 second timeout
    });

    return Promise.race([pm2Promise, timeoutPromise]);
};
