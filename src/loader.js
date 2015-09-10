'use strict';

import loadScript from './load-script.js';

export default class Loader {
    constructor(document, modules = {}, pendingModules = {}) {
        this.document = document;
        this.modules = modules;
        this.pendingModules = pendingModules;
        this.define = this.define.bind(this);
    }

    require (deps, factory, errback) {
       return this._require(deps, factory, errback, []);
    }

    _require(deps, factory, errback, path) {
        const loader = this;
        return Promise.all(deps.map(dependency => {
            if (path.indexOf(dependency) > -1) {
                return Promise.reject(
                    new Error(`Circular dependency: ${path.concat(dependency).join(' -> ')}`)
                );
            }

            if (!loader.modules[dependency]) {
                loader.modules[dependency] = loader.loadScript(dependency, path);
            }

            return loader.modules[dependency];
        }))
        .then((modules) => {
            return factory.apply(null, modules);
        })
        .catch(reason => {
            if (typeof errback === 'function') {
                errback(reason);
            }

            return Promise.reject(reason);
        });
    }

    define(name, deps, factory) {
        const moduleDef = this.pendingModules[name];
        const module = this._require(
            deps,
            factory,
            () => null,
            moduleDef ? moduleDef.path : []);

        if (moduleDef) {
            moduleDef.resolve(module);
            delete this.pendingModules[name];
        } else {
            this.modules[name] = module;
        }
    }

    loadScript (dependency, path) {
        //
        //loader.modules[dependency] = deferred.promise;
        //
        const loader = this;
        const {name, deferred} = loadScript(
            dependency,
            this.document,
            () => null,
            () => {
                delete loader.pendingModules[name];
                deferred.reject(new Error(`Error while loading module ${name}`))
            }
        );

        deferred.path = path.concat(name);
        loader.pendingModules[name] = deferred;
        return deferred.promise;
    }
};

