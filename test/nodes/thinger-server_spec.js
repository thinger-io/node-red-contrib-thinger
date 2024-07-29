const helper = require("node-red-node-test-helper");
const assert = require('node:assert/strict');
const Config = require("./config");
const thingerServerNode = require("../../nodes/thinger-server.js");
const assetIteratorNode = require("../../nodes/asset-iterator");

helper.init(require.resolve('node-red'));

describe('thinger-server Node', function () {

    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });

    it('node should be loaded', function (done) {
        const flow = [{ id: "n1", type: "thinger-server", name: "thinger-server" }];
        helper.load(thingerServerNode, flow, function () {
            const n1 = helper.getNode("n1");
            try {
                assert.equal(n1.name, 'thinger-server');
                done();
            } catch(err) {
                done(err);
            }
        });
    });

    it('node should be initialized with credentials', function (done) {
        const flow = [{ id: "n1", type: "thinger-server", name: "thinger-server" }];
        const credentials = {"n1": {token: "token"}};
        helper.load(thingerServerNode, flow, credentials, function () {
            const n1 = helper.getNode("n1");
            try {
                assert.equal(n1.credentials.token, 'token');
                done();
            } catch(err) {
                done(err);
            }
        });

    });

    it('node should fail due to missing token', function (done) {

        const flow = [
            {id: "n1", type: "asset-iterator", name: "asset-iterator", server: Config.getServerId(), wires: [["n2"]]},
            {id: "n2", type: "helper"},
            Config.getServer()
        ];

        helper.load([thingerServerNode, assetIteratorNode], flow, function () {

            const n0 = helper.getNode("n0");

            n0.on("call:error", msg => {
                try {
                    assert.equal(msg.firstArg, "Please, provide the Access Token");
                    done();
                } catch (err) {
                    done(err);
                }

            });

        });


    });

});