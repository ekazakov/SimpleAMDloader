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
        loadScript('./base/test/fixtures/simple-script.js', frame.contentDocument, () => done())
            .promise
            .catch(err => done(new Error(err)))
        ;
    });

    it('Loader class should require modules', (done) => {
        const loader = new Loader({document: frame.contentDocument});
        loader.config({
            baseUrl: './base/test/fixtures/'
        });

        frame.contentWindow.define = loader.define;

        const factory = (...modules) => {
            expect(modules.length).to.equal(2);
            expect(modules).to.eql(["module C with module A", "module B"]);
            done();
        };
        loader
            .require(['C', 'B'], factory, noop)
            .catch(err => done(new Error(err)))
        ;

    });

    it.skip('Should define and execute modules', (done) => {
        const loader = new Loader({document: frame.contentDocument});

        loader.define('foo', () => done());
    });

    it('Should load anonymous modules', (done) => {
        const loader = new Loader({document: frame.contentDocument});
        loader.config({ baseUrl: './base/test/fixtures/'});
        frame.contentWindow.define = loader.define;

        loader.require(['anon'],
            (module) => {
                expect(module).to.equal('Anonymous module');
                done();
            },
            (err) => done(err)
        );
    });

    it("should detect circular dependency", (done) => {
        const modA = 'base/test/fixtures/circular A';
        const loader = new Loader({document: frame.contentDocument});
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
        const loader = new Loader({document: frame.contentDocument});
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

    it('should support lazy modules', (done) => {
        const loader = new Loader({document: frame.contentDocument});
        const define = loader.define;

        define('A', ['B'], (b) => `module A and ${b}`);
        //define('B', () => 'module B');
        setTimeout(() => define('B', () => 'module B'), 10);
        setTimeout(() => {
            loader.require(['A'],
                (a) => {
                    expect(a).to.equal('module A and module B');
                    done();
                },
                (err) => done(err)
            )
        }, 30);
    });

    it('should support paths confing', (done) => {
        const loader = new Loader({document: frame.contentDocument});
        frame.contentWindow.define = loader.define;
        loader.config({
            baseUrl: './base/test/fixtures/',
            paths: {
                F: './base/test/somedir/F.js'
            }
        });

        loader.require(['F'],
            (F) => {
                expect(F).to.eql('module F and module B');
                done();
            },
            (err) => done(err)
        )
    });

    it('should support bundles config', () => {
        const loader = new Loader({document: frame.contentDocument});
        loader.config({
            baseUrl: './js/',
            bundles: {
                pack: ['E', 'G']
            }
        });

        expect(loader.toUrl('E')).to.equal('./js/pack.js');
        expect(loader.toUrl('G')).to.equal('./js/pack.js');
        expect(loader.toUrl('A')).to.equal('./js/A.js');
    });

    it('should load shim', (done) => {
        const loader = new Loader({document: frame.contentDocument});
        frame.contentWindow.define = loader.define;
        loader.config({
            baseUrl: './base/test/fixtures/',
            shim: {
                'no-amd': {
                    exports: 'window.foo'
                },
                'no-amd-plugin': {
                    deps: ['no-amd'],
                    exports: 'window.bar'
                }
            }
        });

        loader.require(['no-amd-plugin'],
            (module) => {
                expect(module).to.equal(2);
                expect(frame.contentWindow.bar).to.equal(2);
                done();
            },
            (err) => done(err));
    });

    afterEach(() => {
        document.body.removeChild(frame);
    });
});
