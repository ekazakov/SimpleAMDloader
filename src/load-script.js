'use strict'

import defer from './defer.js';

export default function loadScript (name, document, onLoad, onError) {
    const deferred = defer();
    const element = document.createElement('script');

    Object.assign(element, {
        async: true,
        onload: onLoad,
        onerror: onError || deferred.reject,
        src: `./${name}.js`
    });

    document.body.appendChild(element);
    return {name, deferred};
}
