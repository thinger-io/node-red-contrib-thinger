const assert = require('node:assert/strict');
const helper = require("node-red-node-test-helper");
const api = require("../../test/api/mocks.js");
const Config = require("./config");
const assetIteratorNode = require("../../nodes/asset-iterator.js");
const thingerServerNode = require("../../nodes/thinger-server.js");

helper.init(require.resolve('node-red'));

describe('asset-iterator Node', function () {

    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });

    it('node should be loaded', function (done) {
        const flow = [{ id: "n1", type: "asset-iterator", name: "asset-iterator" }];
        helper.load(assetIteratorNode, flow, function () {
            const n1 = helper.getNode("n1");
            try {
                assert.equal(n1.name, 'asset-iterator');
                done();
            } catch(err) {
                done(err);
            }
        });
    });

    it('node should throw an error due to missing asset type', function (done) {

        const flow = [
            {id: "n1", type: "asset-iterator", name: "asset-iterator", server: Config.getServerId(), wires: [["n2"]]},
            {id: "n2", type: "helper"},
            Config.getServer()
        ];

        helper.load([assetIteratorNode, thingerServerNode], flow, Config.getCredentials(), function () {

            /*
            console.log('Current Log messages (all levels)', helper.log().args)
            console.table(helper.log().args.map(e => e[0]))
            console.log('Current Log messages (fatal, error, warn, info)', helper.log().args.filter((event) => event[0].level >= 40))
            */

            const n0 = helper.getNode("n0");
            const n1 = helper.getNode("n1");

            n0.on("call:error", msg => {
                try {
                    throw (new Error(msg));
                } catch (err) {
                    done(err.message);
                }
            });

            n1.on("call:error", function (msg) {
                try {
                    assert.equal(msg.firstArg, "Asset not found");
                    done();
                } catch (err) {
                   done(err);
                }
            });

            n1.receive({});

        });

    });

    it('node should return all devices', function (done) {

        //this.timeout(30000); // 10 seconds

        const flow = [
            {id: "n1", type: "asset-iterator", name: "asset-iterator", asset: "device", server: Config.getServerId(), wires: [["n2"]]},
            {id: "n2", type: "helper"},
            Config.getServer()
        ];

        helper.load([assetIteratorNode, thingerServerNode], flow, Config.getCredentials(), function () {

            const n0 = helper.getNode("n0");
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");

            n0.on("call:error", msg => {
                try {
                    throw (new Error(msg));
                } catch (err) {
                    done(err.message);
                }
            });
            n1.on("call:error", msg => {
                try {
                    throw (new Error(msg));
                } catch (err) {
                    done(err.message);
                }

            });

            // response needs to be joined as per each device a new message is created
            let response = [];
            let validResponse = require("../api/responses/devices.json");
            n2.on("input", function (msg) {
                try {
                    response.push(msg.payload)
                    if (response.length === validResponse.length) {
                        assert.deepEqual(response, validResponse);
                        done();
                    }
                } catch (err) {
                    done(err);
                }
            });
            n1.receive({});

        });

    });

});
