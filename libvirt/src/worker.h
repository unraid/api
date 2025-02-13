/**
 * Copyright 2019 Leon Rinkel <leon@rinkel.me> and vmngr/libvirt contributers.
 * 
 * This file is part of the vmngr/libvirt project and is subject to the MIT
 * license as in the LICENSE file in the project root.
 */

#ifndef SRC_WORKER_H_
#define SRC_WORKER_H_

#include <napi.h>

#include "src/hypervisor.h"

class Worker : public Napi::AsyncWorker {
 protected:
    Napi::Promise::Deferred deferred;
    Hypervisor* hypervisor;

    void SetVirError(void);

 public:
    Worker(
        Napi::Function const& callback,
        Napi::Promise::Deferred deferred,
        Hypervisor* hypervisor)
        : Napi::AsyncWorker(callback), deferred(deferred),
          hypervisor(hypervisor) {}

    void OnError(const Napi::Error& err);
    void OnOK(void);
};

#endif  // SRC_WORKER_H_
