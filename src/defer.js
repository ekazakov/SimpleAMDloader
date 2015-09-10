'use strict'

export default function defer () {
    let result = {};
    result.promise = new Promise(function (resolve, reject) {
        Object.assign(result, {resolve, reject});
    });

    return result;
}
