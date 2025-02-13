/**
 * Copyright 2019 Leon Rinkel <leon@rinkel.me> and vmngr/libvirt contributers.
 * 
 * This file is part of the vmngr/libvirt project and is subject to the MIT
 * license as in the LICENSE file in the project root.
 */

#include <napi.h>
#include <libvirt/libvirt.h>

#include "src/hypervisor.h"
#include "src/domain.h"

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    Hypervisor::Init(env, exports);
    Domain::Init(env, exports);
    return exports;
}

NODE_API_MODULE(libvirt, Init)
