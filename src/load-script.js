'use strict'

import defer from './defer.js';

export default function loadScript (url, document, onLoad, onError) {
    const deferred = defer();
    const element = document.createElement('script');

    Object.assign(element, {
        async: true,
        onload: onLoad,
        onerror: onError || deferred.reject,
        src: url
    });

    document.body.appendChild(element);
    return deferred;
}
