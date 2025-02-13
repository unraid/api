{
    "targets": [
        {
            "target_name": "libvirt",
            "sources": [
                "src/libvirt.cc",
                "src/worker.cc",
                "src/hypervisor.cc",
                "src/hypervisor-connect.cc",
                "src/hypervisor-domain.cc",
                "src/hypervisor-node.cc",
                "src/domain.cc"
            ],
            "include_dirs": [
                "<!@(node -p \"require('node-addon-api').include\")",
                "<!@(pkg-config --cflags-only-I libvirt | sed 's/-I//g')",
                "."
            ],
            "conditions": [
                ["OS==\"mac\"", {
                    "include_dirs": ["<!(echo $LIBVIRT_INCLUDE_DIR)"],
                    "libraries": [
                        "<!(echo $LIBVIRT_LIB_DIR)/libvirt.dylib"
                    ],
                    "xcode_settings": {
                        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
                        "CLANG_CXX_LIBRARY": "libc++",
                        "MACOSX_DEPLOYMENT_TARGET": "10.15"
                    }
                }],
                ["OS!=\"mac\"", {
                    "libraries": [
                        "<!@(pkg-config --libs libvirt)"
                    ]
                }]
            ],
            "cflags!": [ "-fno-exceptions" ],
            "cflags_cc!": [ "-fno-exceptions" ],
            "defines": [ "NAPI_CPP_EXCEPTIONS" ]
        }
    ]
}
