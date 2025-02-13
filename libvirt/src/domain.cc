/**
 * Copyright 2019 Leon Rinkel <leon@rinkel.me> and vmngr/libvirt contributers.
 * 
 * This file is part of the vmngr/libvirt project and is subject to the MIT
 * license as in the LICENSE file in the project root.
 */

#include "src/domain.h"

Napi::FunctionReference Domain::constructor;
Napi::Object Domain::Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(env, "Domain", {});

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Domain", func);
    return exports;
}

/******************************************************************************
 * Constructor                                                                *
 ******************************************************************************/

Domain::Domain(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<Domain>(info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    if (info.Length() <= 0 || !info[0].IsExternal()) {
        Napi::TypeError::New(env, "Expected an external.")
            .ThrowAsJavaScriptException();
        return;
    }

    domainPtr = info[0].As<Napi::External<virDomain>>().Data();
}

/******************************************************************************
 * Destructor                                                                 *
 ******************************************************************************/

Domain::~Domain(void) {
    if (domainPtr) virDomainFree(domainPtr);
}
