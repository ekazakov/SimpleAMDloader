'use strict'

define('base/test/fixtures/circular B', ['base/test/fixtures/circular C'], function() {
    return 'module B';
});
