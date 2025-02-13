/**
 * Copyright 2019 Leon Rinkel <leon@rinkel.me> and vmngr/libvirt contributers.
 * 
 * This file is part of the vmngr/libvirt project and is subject to the MIT
 * license as in the LICENSE file in the project root.
 */

#include "src/hypervisor.h"

Napi::FunctionReference Hypervisor::constructor;
Napi::Object Hypervisor::Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);

    Napi::Function func = DefineClass(env, "Hypervisor", {
        InstanceMethod("connectOpen", &Hypervisor::ConnectOpen),
        InstanceMethod("connectClose", &Hypervisor::ConnectClose),
        InstanceMethod("connectListAllDomains",
            &Hypervisor::ConnectListAllDomains),
        InstanceMethod("connectListDomains", &Hypervisor::ConnectListDomains),
        InstanceMethod("connectListDefinedDomains",
            &Hypervisor::ConnectListDefinedDomains),
        InstanceMethod("connectGetMaxVcpus", &Hypervisor::ConnectGetMaxVcpus),
        InstanceMethod("connectGetHostname", &Hypervisor::ConnectGetHostname),

        InstanceMethod("domainCreateXML", &Hypervisor::DomainCreateXML),
        InstanceMethod("domainDefineXML", &Hypervisor::DomainDefineXML),
        InstanceMethod("domainGetInfo", &Hypervisor::DomainGetInfo),
        InstanceMethod("domainGetID", &Hypervisor::DomainGetID),
        InstanceMethod("domainGetName", &Hypervisor::DomainGetName),
        InstanceMethod("domainGetUUIDString", &Hypervisor::DomainGetUUIDString),
        InstanceMethod("domainLookupByID", &Hypervisor::DomainLookupByID),
        InstanceMethod("domainLookupByName", &Hypervisor::DomainLookupByName),
        InstanceMethod("domainLookupByUUIDString",
            &Hypervisor::DomainLookupByUUIDString),
        InstanceMethod("domainSave", &Hypervisor::DomainSave),
        InstanceMethod("domainCreate", &Hypervisor::DomainCreate),
        InstanceMethod("domainShutdown", &Hypervisor::DomainShutdown),
        InstanceMethod("domainRestore", &Hypervisor::DomainRestore),
        InstanceMethod("domainGetXMLDesc", &Hypervisor::DomainGetXMLDesc),

        InstanceMethod("nodeGetInfo", &Hypervisor::NodeGetInfo)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Hypervisor", func);
    return exports;
}

/******************************************************************************
 * Constructor                                                                *
 ******************************************************************************/

Hypervisor::Hypervisor(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<Hypervisor>(info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    if (info.Length() <= 0 || !info[0].IsObject()) {
        Napi::TypeError::New(env, "Expected an object.")
            .ThrowAsJavaScriptException();
        return;
    }

    Napi::Object options = info[0].As<Napi::Object>();

    if (!options.HasOwnProperty("uri")) {
        Napi::TypeError::New(env, "Expected options to have property 'uri'.")
            .ThrowAsJavaScriptException();
        return;
    }

    Napi::String uri = options.Get("uri").As<Napi::String>();
    this->uri = std::string(uri.Utf8Value());
}
