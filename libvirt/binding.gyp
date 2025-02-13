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
                ".",
                "/usr/include"
            ],
            "dependencies": [
                "<!(node -p \"require('node-addon-api').gyp\")"
            ],
            "cflags!": [ "-fno-exceptions" ],
            "cflags_cc!": [ "-fno-exceptions" ],
            "xcode_settings": {
                "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
                "CLANG_CXX_LIBRARY": "libc++",
                "MACOSX_DEPLOYMENT_TARGET": "<!(command -v sw_vers >/dev/null && sw_vers -productVersion | cut -d. -f1,2 || echo '10.13')"
            },
            "msvs_settings": {
                "VCCLCompilerTool": { "ExceptionHandling": 1 }
            },
            "conditions": [
                ["OS==\"mac\"", {
                    "include_dirs": ["<!(echo $LIBVIRT_INCLUDE_DIR)"],
                    "libraries": [
                        "<!(echo ${LIBVIRT_LIB_DIR:=/opt/homebrew/lib})/libvirt.dylib"
                    ],
                    "defines": [ "NAPI_CPP_EXCEPTIONS" ]
                }],
                ["OS!=\"mac\"", {
                    "include_dirs": [
                        "<!@(pkg-config --cflags-only-I libvirt 2>/dev/null | sed 's/-I//g')",
                        "/usr/include",
                        "/usr/local/include"
                    ],
                    "libraries": [
                        "<!@(pkg-config --libs libvirt 2>/dev/null || echo '-lvirt')"
                    ]
                }]
            ]
        }
    ]
}
