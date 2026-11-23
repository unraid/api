/** Only a known native result for the command submitted may enter onboarding output. */
export class StorageCommandError extends Error {
    static fromReply(
        commands: Record<string, unknown>,
        result: unknown,
        slot: unknown
    ): StorageCommandError | undefined {
        const pool = commands.poolName;
        const target =
            typeof pool === 'string' && /^[a-z][a-z0-9_-]{0,39}$/.test(pool)
                ? `pool "${pool}"`
                : 'the selected pool';

        if (commands.cmdCreatePool === 'apply') {
            switch (result) {
                case 'create-pool-storage-active':
                    return new StorageCommandError(`Stop storage before creating ${target}.`);
                case 'create-pool-invalid':
                    return new StorageCommandError(`Check the name and slot count for ${target}.`);
                case 'create-pool-failed':
                    return new StorageCommandError(
                        `Could not create ${target}. Check the boot device and pool configuration.`
                    );
                case 'create-pool-refresh-failed':
                    return new StorageCommandError(
                        `Storage could not refresh after creating ${target}. Reload Storage and check the pool before retrying.`
                    );
            }
        }

        if (commands.cmdMakeBootable === 'apply') {
            const device =
                typeof slot === 'string' && /^(0|[1-9]\d{0,3})$/.test(slot) && Number(slot) <= 4094
                    ? `${target} (storage slot ${slot})`
                    : target;
            switch (result) {
                case 'make-bootable-storage-active':
                    return new StorageCommandError(`Stop storage before making ${device} bootable.`);
                case 'make-bootable-invalid':
                    return new StorageCommandError(
                        `Check the boot pool and reserved size for ${device}.`
                    );
                case 'make-bootable-ineligible':
                    return new StorageCommandError(
                        `Check boot eligibility and the assigned drives for ${device}.`
                    );
                case 'make-bootable-size':
                    return new StorageCommandError(
                        `Check the reserved boot size and available drive space for ${device}.`
                    );
                case 'make-bootable-refresh-failed':
                    return new StorageCommandError(
                        `Storage could not refresh after boot setup for ${device}. Reload Storage and check the boot configuration before retrying.`
                    );
                case 'make-bootable-failed':
                    return new StorageCommandError(
                        `Boot setup did not finish for ${device}. Check the drives and boot configuration before retrying.`
                    );
            }
        }
        return undefined;
    }
}
