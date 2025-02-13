/**
 * Copyright 2019 Leon Rinkel <leon@rinkel.me> and vmngr/libvirt contributers.
 * 
 * This file is part of the vmngr/libvirt project and is subject to the MIT
 * license as in the LICENSE file in the project root.
 */

#include "src/hypervisor.h"

#include "src/worker.h"
#include "src/domain.h"

static void dummyErrorFunc(void* userData, virErrorPtr err) {}

static Napi::Value dummyCallback(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);
    return env.Undefined();
}

/******************************************************************************
 * ConnectOpen                                                                *
 ******************************************************************************/

class ConnectOpenWorker : public Worker {
 public:
    using Worker::Worker;

    void Execute(void) override {
        virSetErrorFunc(NULL, dummyErrorFunc);
        hypervisor->conn = virConnectOpen(hypervisor->uri.c_str());
        if (hypervisor->conn == NULL) SetVirError();
    }
};

Napi::Value Hypervisor::ConnectOpen(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    Napi::Function callback = Napi::Function::New(env, dummyCallback);
    Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);

    ConnectOpenWorker* worker = new ConnectOpenWorker(callback, deferred, this);
    worker->Queue();

    return deferred.Promise();
}

/******************************************************************************
 * ConnectClose                                                               *
 ******************************************************************************/

class ConnectCloseWorker : public Worker {
 public:
    using Worker::Worker;

    void Execute(void) override {
        virConnectClose(hypervisor->conn);
    }
};

Napi::Value Hypervisor::ConnectClose(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    Napi::Function callback = Napi::Function::New(env, dummyCallback);
    Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);

    ConnectCloseWorker* worker =
        new ConnectCloseWorker(callback, deferred, this);
    worker->Queue();

    return deferred.Promise();
}

/******************************************************************************
 * ConnectListAllDomains                                                      *
 ******************************************************************************/

class ConnectListAllDomainsWorker : public Worker {
 public:
    ConnectListAllDomainsWorker(
        Napi::Function const& callback,
        Napi::Promise::Deferred deferred,
        Hypervisor* hypervisor,
        unsigned int flags)
        : Worker(callback, deferred, hypervisor), flags(flags) {}

    void Execute(void) override {
        numDomains = virConnectListAllDomains(
            hypervisor->conn, &domainPtrs, flags);
        if (numDomains < 0) SetVirError();
    }

    void OnOK(void) override {
        Napi::HandleScope scope(Env());

        Napi::Array domains = Napi::Array::New(Env());
        for (int i = 0; i < numDomains; i++) {
            Napi::Object domain = Domain::constructor.New({
                Napi::External<virDomain>::New(Env(), domainPtrs[i]) });
            domains.Set(i, domain);
        }
        free(domainPtrs);

        deferred.Resolve(domains);
        Callback().Call({});
    }

 private:
    unsigned int flags;
    virDomainPtr* domainPtrs;
    int numDomains;
};

Napi::Value Hypervisor::ConnectListAllDomains(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    Napi::Function callback = Napi::Function::New(env, dummyCallback);
    Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);

    unsigned int flags = 0;

    if (info.Length() >= 1 && info[0].IsNumber()) {
        flags = info[0].As<Napi::Number>();
    } else if (info.Length() >= 1 && !info[0].IsNumber()) {
        deferred.Reject(Napi::String::New(env, "Expected a number."));
        return deferred.Promise();
    }

    ConnectListAllDomainsWorker* worker =
        new ConnectListAllDomainsWorker(callback, deferred, this, flags);
    worker->Queue();

    return deferred.Promise();
}

/******************************************************************************
 * ConnectListDomains                                                         *
 ******************************************************************************/

class ConnectListDomainsWorker : public Worker {
 public:
    using Worker::Worker;

    void Execute(void) override {
        numActiveDomains = virConnectNumOfDomains(hypervisor->conn);
        activeDomainIds = reinterpret_cast<int*>(
            malloc(sizeof(int) * numActiveDomains));
        numActiveDomains = virConnectListDomains(hypervisor->conn,
            activeDomainIds, numActiveDomains);
    }

    void OnOK(void) override {
        Napi::HandleScope scope(Env());

        Napi::Array activeDomains = Napi::Array::New(Env());
        for (int i = 0; i < numActiveDomains; i++)
            activeDomains.Set(i, activeDomainIds[i]);
        free(activeDomainIds);

        deferred.Resolve(activeDomains);
        Callback().Call({});
    }

 private:
    int numActiveDomains;
    int* activeDomainIds;
};

Napi::Value Hypervisor::ConnectListDomains(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    Napi::Function callback = Napi::Function::New(env, dummyCallback);
    Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);

    ConnectListDomainsWorker* worker =
        new ConnectListDomainsWorker(callback, deferred, this);
    worker->Queue();

    return deferred.Promise();
}

/******************************************************************************
 * ConnectListDefinedDomains                                                  *
 ******************************************************************************/

class ConnectListDefinedDomainsWorker : public Worker {
 public:
    using Worker::Worker;

    void Execute(void) override {
        numInactiveDomains =
            virConnectNumOfDefinedDomains(hypervisor->conn);
        inactiveDomainNames = reinterpret_cast<char**>(
            malloc(sizeof(char*) * numInactiveDomains));
        numInactiveDomains = virConnectListDefinedDomains(hypervisor->conn,
            inactiveDomainNames, numInactiveDomains);
    }

    void OnOK(void) override {
        Napi::HandleScope scope(Env());

        Napi::Array inactiveDomains = Napi::Array::New(Env());
        for (int i = 0; i < numInactiveDomains; i++) {
            inactiveDomains.Set(i, inactiveDomainNames[i]);
            free(inactiveDomainNames[i]);
        }
        free(inactiveDomainNames);

        deferred.Resolve(inactiveDomains);
        Callback().Call({});
    }

 private:
    int numInactiveDomains;
    char** inactiveDomainNames;
};

Napi::Value Hypervisor::ConnectListDefinedDomains(
    const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    Napi::Function callback = Napi::Function::New(env, dummyCallback);
    Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);

    ConnectListDefinedDomainsWorker* worker =
        new ConnectListDefinedDomainsWorker(callback, deferred, this);
    worker->Queue();

    return deferred.Promise();
}

/******************************************************************************
 * ConnectGetMaxVcpus                                                         *
 ******************************************************************************/

class ConnectGetMaxVcpusWorker : public Worker {
 public:
    ConnectGetMaxVcpusWorker(
        Napi::Function const& callback,
        Napi::Promise::Deferred deferred,
        Hypervisor* hypervisor,
        std::string type)
        : Worker(callback, deferred, hypervisor), type(type) {}

    void Execute(void) override {
        const char* type = (this->type.empty()) ? NULL : this->type.c_str();
        maxVcpus = virConnectGetMaxVcpus(hypervisor->conn, type);
        if (maxVcpus < 0) SetVirError();
    }

    void OnOK(void) override {
        Napi::HandleScope scope(Env());
        deferred.Resolve(Napi::Number::New(Env(), maxVcpus));
        Callback().Call({});
    }

 private:
    std::string type;
    int maxVcpus;
};

Napi::Value Hypervisor::ConnectGetMaxVcpus(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    Napi::Function callback = Napi::Function::New(env, dummyCallback);
    Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);

    std::string type;

    if (info.Length() >= 1 && info[0].IsString()) {
        type = info[0].As<Napi::String>();
    } else if (info.Length() >= 1 && !info[0].IsString()) {
        deferred.Reject(Napi::String::New(env, "Expected a string."));
        return deferred.Promise();
    }

    ConnectGetMaxVcpusWorker* worker =
        new ConnectGetMaxVcpusWorker(callback, deferred, this, type);
    worker->Queue();

    return deferred.Promise();
}

/******************************************************************************
 * ConnectGetHostname                                                         *
 ******************************************************************************/

class ConnectGetHostnameWorker : public Worker {
 public:
    using Worker::Worker;

    void Execute(void) override {
        hostname = virConnectGetHostname(hypervisor->conn);
        if (hostname == NULL) SetVirError();
    }

    void OnOK(void) override {
        Napi::HandleScope scope(Env());

        Napi::String hostnameStr = Napi::String::New(Env(), hostname);
        free(hostname);

        deferred.Resolve(hostnameStr);
        Callback().Call({});
    }

 private:
    char* hostname;
};

Napi::Value Hypervisor::ConnectGetHostname(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    Napi::Function callback = Napi::Function::New(env, dummyCallback);
    Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);

    ConnectGetHostnameWorker* worker =
        new ConnectGetHostnameWorker(callback, deferred, this);
    worker->Queue();

    return deferred.Promise();
}
