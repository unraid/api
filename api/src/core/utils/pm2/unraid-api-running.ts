export const isUnraidApiRunning = async (): Promise<boolean | undefined> => {
    const { connect, describe, disconnect } = await import('pm2');
    return new Promise((resolve, reject) => {
        connect(function (err) {
            if (err) {
                console.error(err);
                reject('Could not connect to pm2');
            }

            describe('unraid-api', function (err, processDescription) {
                console.log(err);
                if (err || processDescription.length === 0) {
                    console.log(false); // Service not found or error occurred
                    resolve(false);
                } else {
                    const isOnline = processDescription?.[0]?.pm2_env?.status === 'online';
                    console.log(isOnline); // Output true if online, false otherwise
                    resolve(isOnline);
                }

                disconnect();
            });
        });
    });
};
