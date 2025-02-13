/**
 * Copyright 2019 Leon Rinkel <leon@rinkel.me> and vmngr/libvirt contributers.
 * 
 * This file is part of the vmngr/libvirt project and is subject to the MIT
 * license as in the LICENSE file in the project root.
 */

#include "src/hypervisor.h"

#include "src/worker.h"

static Napi::Value dummyCallback(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);
    return env.Undefined();
}

/******************************************************************************
 * NodeGetInfo                                                                *
 ******************************************************************************/

class NodeGetInfoWorker : public Worker {
 public:
    using Worker::Worker;

    void Execute(void) override {
        int ret = virNodeGetInfo(hypervisor->conn, &nodeInfo);
        if (ret < 0) SetVirError();
    }

    void OnOK(void) override {
        Napi::HandleScope scope(Env());

        Napi::Object info = Napi::Object::New(Env());
        info.Set("model", Napi::String::New(Env(), nodeInfo.model));
        info.Set("memory", Napi::Number::New(Env(), nodeInfo.memory));
        info.Set("cpus", Napi::Number::New(Env(), nodeInfo.cpus));
        info.Set("mhz", Napi::Number::New(Env(), nodeInfo.mhz));
        info.Set("nodes", Napi::Number::New(Env(), nodeInfo.nodes));
        info.Set("sockets", Napi::Number::New(Env(), nodeInfo.sockets));
        info.Set("cores", Napi::Number::New(Env(), nodeInfo.cores));
        info.Set("threads", Napi::Number::New(Env(), nodeInfo.threads));

        deferred.Resolve(info);
        Callback().Call({});
    }

 private:
    virNodeInfo nodeInfo;
};

Napi::Value Hypervisor::NodeGetInfo(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);
    Napi::Function callback = Napi::Function::New(env, dummyCallback);

    NodeGetInfoWorker* worker = new NodeGetInfoWorker(callback, deferred, this);
    worker->Queue();

    return deferred.Promise();
}
