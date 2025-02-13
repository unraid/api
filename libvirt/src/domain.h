/**
 * Copyright 2019 Leon Rinkel <leon@rinkel.me> and vmngr/libvirt contributers.
 * 
 * This file is part of the vmngr/libvirt project and is subject to the MIT
 * license as in the LICENSE file in the project root.
 */

#ifndef SRC_DOMAIN_H_
#define SRC_DOMAIN_H_

#include <napi.h>

#include <libvirt/libvirt.h>
#include <libvirt/virterror.h>
#include <libvirt/libvirt-domain.h>

#include "src/hypervisor.h"

class Domain : public Napi::ObjectWrap<Domain> {
 public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    explicit Domain(const Napi::CallbackInfo& info);
    ~Domain(void);

 private:
    static Napi::FunctionReference constructor;

    virDomainPtr domainPtr = nullptr;

    friend class ConnectListAllDomainsWorker;

    friend class DomainCreateXMLWorker;
    friend class DomainDefineXMLWorker;
    friend class DomainGetInfoWorker;
    friend class DomainGetIDWorker;
    friend class DomainGetNameWorker;
    friend class DomainGetUUIDStringWorker;
    friend class DomainLookupByIDWorker;
    friend class DomainLookupByNameWorker;
    friend class DomainLookupByUUIDStringWorker;
    friend class DomainSaveWorker;
    friend class DomainCreateWorker;
    friend class DomainShutdownWorker;
    friend class DomainRestoreWorker;
    friend class DomainGetXMLDescWorker;
};

#endif  // SRC_DOMAIN_H_
