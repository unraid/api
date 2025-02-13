const chalk = require ("chalk");

const { Hypervisor, ConnectListAllDomainsFlags } = require("../dist");

const main = async () => {
    const uri = process.env.LIBVIRT_URI || "qemu:///system";
    const hypervisor = new Hypervisor({ uri });

    // Connecting to our hypervisor
    await hypervisor.connectOpen();

    const inactiveDomains = await hypervisor.connectListAllDomains(ConnectListAllDomainsFlags.INACTIVE);

    if (inactiveDomains.length === 0) {
        process.stdout.write("No domains to start :(");
        return;
    }

    for (const inactiveDomain of inactiveDomains) {
        const domainName = await hypervisor.domainGetName(inactiveDomain);

        process.stdout.write(`Starting domain: ${chalk.blue(domainName)} ... `);

        await hypervisor.domainCreate(inactiveDomain).then(() => {
            process.stdout.write(`domain ${chalk.green(domainName)} has been started!\n\n`);
        }).catch(err => {
            process.stderr.write(`domain ${chalk.red(domainName)} shutdown ERROR: ${err} \n\n`);
        });
    }

};

main().catch(console.error);