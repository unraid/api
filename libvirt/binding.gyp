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
                "<!@(pkg-config --cflags-only-I libvirt 2>/dev/null || echo '-I/usr/include/libvirt -I/usr/local/include/libvirt'| sed 's/-I//g')",
                "."
            ],
            "dependencies": [
                "<!(node -p \"require('node-addon-api').gyp\")"
            ],
            "cflags!": [ "-fno-exceptions" ],
            "cflags_cc!": [ "-fno-exceptions" ],
            "xcode_settings": {
                "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
                "CLANG_CXX_LIBRARY": "libc++",
                "MACOSX_DEPLOYMENT_TARGET": "<!(sw_vers -productVersion | cut -d. -f1,2)"
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
                    "libraries": [
                        "<!@(pkg-config --libs libvirt 2>/dev/null || echo '-L/usr/lib -L/usr/local/lib -lvirt')"
                    ],
                    "include_dirs": [
                        "/usr/include/libvirt",
                        "/usr/local/include/libvirt"
                    ]
                }]
            ]
        }
    ]
}
