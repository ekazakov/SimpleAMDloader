'use strict'

import chai from 'chai';
const expect = chai.expect;

import loadScript from '../src/load-script.js';
import Loader from '../src/loader.js';

function noop () {}

describe('Spec', () => {
    let frame;

    beforeEach(() => {
        frame = document.createElement('frame');
        document.body.appendChild(frame);
    });

    it('Load script', (done) => {
        //console.log('h');
        loadScript('base/test/fixtures/simple-script', frame.contentDocument, () => done())
            .deferred.promise
            //.then(() => done())
            .catch(err => done(new Error(err)))
        ;
    });

    it('Loader class should require modules', (done) => {
        const modC = 'base/test/fixtures/C';
        const modB = 'base/test/fixtures/B';
        const loader = new Loader(frame.contentDocument);

        frame.contentWindow.define = loader.define;

        const factory = (...modules) => {
            expect(modules.length).to.equal(2);
            expect(modules).to.eql(["module C with module A", "module B"]);
            done();
        };
        loader
            .require([modC, modB], factory, noop)
            .catch(err => done(new Error(err)))
        ;

    });

    it("should detect circular dependency", (done) => {
        const modA = 'base/test/fixtures/circular A';
        const loader = new Loader(frame.contentDocument);
        frame.contentWindow.define = loader.define;
        let factoryWasCalled = false;

        function onError (error) {
            expect(factoryWasCalled).to.equal(false);
            expect(error).to.be.instanceOf(Error);
            expect(error.message).to.be.contains('Circular dependency');
            done();
        }

        loader.require([modA], () => factoryWasCalled = true, onError);
    });

    it('Should return error if module loading failed', (done) => {
        const loader = new Loader(frame.contentDocument);
        const onError = (error) => {
            expect(error).to.be.instanceOf(Error);
            expect(error.message).to.be.contains('Error while loading module dev/null');
            done();
        }
        frame.contentWindow.define = loader.define;

        loader.require(['dev/null'], () => null, onError)
            .catch(err => done(err))
        ;
    });

    afterEach(() => {
        document.body.removeChild(frame);
    });
});
