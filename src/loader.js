'use strict';

import loadScript from './load-script.js';
import deepMerge from 'deepmerge';

export default class Loader {
    constructor({document, modules = {}, pendingModules = {}, config = null}) {
        this.document = document;
        this.modules = modules;
        this.pendingModules = pendingModules;
        this.predefines = {};
        this._config = config || {
            baseUrl: './',
            paths: {},
            bundles: {},
            shim: {}
        };
        this.define = this.define.bind(this);
    }

    toUrl(name, appendJs = true) {
        const {baseUrl, paths, bundles} = this._config;
        for (let bundleName of Object.keys(bundles)) {
            if (bundles[bundleName].indexOf(name) != -1) {
                return this.toUrl(bundleName);
            }
        }

        if (paths[name]) {
            return paths[name];
        }
        return baseUrl + name + (appendJs ? '.js' : '');
    }

    require (deps, factory, errback) {
        return this._require(deps, factory, errback, []);
    }

    _require(deps, factory, errback, path) {
        return Promise.all(deps.map(dependency => {
            if (path.indexOf(dependency) > -1) {
                return Promise.reject(
                    new Error(`Circular dependency: ${path.concat(dependency).join(' -> ')}`)
                );
            }

            if (this.predefines[dependency]) {
                const [deps, factory] = this.predefines[dependency];
                this.modules[dependency] = this._require(deps, factory, errback, [dependency]);
            } else if (this._config.shim[dependency]) {
                const shim = this._config.shim[dependency];
                this.modules[dependency] = this.loadShim(dependency, shim, path);
            } else if (!this.modules[dependency]) {
                this.modules[dependency] = this.loadScript(dependency, path);
            }

            return this.modules[dependency];
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

    config(options) {
        this._config = deepMerge(this._config, options);
    }

    define(...args) {
        let [name, deps, factory] = args;
        if (args.length === 2) {
            factory = deps;
            deps = [];
        } else if (args.length === 1) {
            factory = name;
            deps = [];
            const url = new window.URL(this.document.currentScript.src);
            name = decodeURI(url.pathname.slice(1, -3).split('/').slice(-1));
        }

        const moduleDef = this.pendingModules[name];

        if (moduleDef) {
            const module = this._require(
                deps,
                factory,
                () => null,
                moduleDef ? moduleDef.path : []);

            moduleDef.resolve(module);
            delete this.pendingModules[name];
        } else {
            this.predefines[name] = [deps, factory];
        }
    }

    loadScript (dependency, path) {
        const onLoad = function () {};
        const onError = () => {
            delete this.pendingModules[dependency];
            deferred.reject(new Error(`Error while loading module ${dependency}`))
        };
        const deferred = loadScript(this.toUrl(dependency), this.document, onLoad, onError);

        deferred.path = path.concat(dependency);
        this.pendingModules[dependency] = deferred;
        return deferred.promise;
    }

    loadShim (dependency, shim, path) {
        let deferred;
        const onLoad = () => deferred.resolve();
        const onError = () => {
            deferred.reject(new Error(`Error while loading module ${dependency}`))
        };

        return new Promise((resolve, reject) => {
            this._require(
                shim.deps || [],
                () => {
                    deferred = loadScript(this.toUrl(dependency), this.document, onLoad, onError)
                    deferred.promise.then(() => {
                        const view = this.document.defaultView;
                        return eval(`(view.${shim.exports})`)
                    }).then(resolve, reject);
                },
                null,
                path.concat([dependency])
            ).catch(reject);
        });
    }
};

