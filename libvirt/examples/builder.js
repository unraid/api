const {
    DomainBuilder,
    domainDescToXml,
    domainDescFromXml,
    Hypervisor
} = require("../dist");

const main = async () => {
    const uri = process.env.LIBVIRT_URI || "qemu:///system";
    const hypervisor = new Hypervisor({ uri });

    await hypervisor.connectOpen();

    const template = await domainDescFromXml(
`<domain type="kvm">
    <memory>1048576</memory>
    <currentMemory>1048576</currentMemory>
    <vcpu>1</vcpu>
    <os>
        <type arch="x86_64" machine="q35">hvm</type>
        <boot dev="hd"/>
    </os>
    <devices>
        <emulator>/usr/bin/qemu-system-x86_64</emulator>
        <console type="pty"/>
        <graphics type="vnc" port="-1" listen="0.0.0.0" passwd="test1"/>
    </devices>
</domain>`);

    const domain = new DomainBuilder()
        .fromTemplate(template)

        .setName("test1")
        .setUUID("148d0864-2354-4c27-b82c-731bdd3f320c")

        .addDisk({
            type: "file", device: "disk",
            driver: { name: "qemu", type: "qcow2" },
            source: { file: "/home/leon/test1.img" },
            target: { dev: "vda", bus: "virtio" },
        })

        .addInterface({
            type: "network",
            source: { network: "default" },
            mac: { address: "52:54:00:8e:c6:5f" },
            model: { type: "virtio" },
        })

        .build();

        const xml = domainDescToXml(domain);
        await hypervisor.domainDefineXML(xml);

};

main().catch(console.error);
