/**
 * Copyright 2019 Leon Rinkel <leon@rinkel.me> and vmngr/libvirt contributers.
 * 
 * This file is part of the vmngr/libvirt project and is subject to the MIT
 * license as in the LICENSE file in the project root.
 */

#include "src/worker.h"

#include <string>

void Worker::SetVirError(void) {
    virErrorPtr err = virGetLastError();
    if (err == NULL) SetError("Unknown error");
    else
        SetError(std::string(err->message));
}

void Worker::OnError(const Napi::Error& err) {
    Napi::HandleScope scope(Env());
    deferred.Reject(Napi::String::New(Env(), err.Message()));
    Callback().Call({});
}

void Worker::OnOK() {
    Napi::HandleScope scope(Env());
    deferred.Resolve(Env().Undefined());
    Callback().Call({});
}
