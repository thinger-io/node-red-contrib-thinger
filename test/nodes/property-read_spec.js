const assert = require('assert');
const helper = require('node-red-node-test-helper');
const api = require("../../test/api/mocks.js");
const Config = require("./config");
const propertyReadNode = require("../../nodes/property-read.js");
const thingerServerNode = require("../../nodes/thinger-server.js");

helper.init(require.resolve('node-red'));

describe('property-read Node', function () {

    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });

    it('node should be loaded', function (done) {
        const flow = [{ id: "n1", type: "property-read", name: "property-read" }];
        helper.load(propertyReadNode, flow, function () {
            const n1 = helper.getNode("n1");
            try {
                assert.equal(n1.name, 'property-read');
                done();
            } catch(err) {
                done(err);
            }
        });
    });

});