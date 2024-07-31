const assert = require('assert');
const helper = require('node-red-node-test-helper');
const api = require("../api/mocks.js");
const Config = require("./config");
const bucketExportNode = require("../../nodes/bucket-export.js");
const thingerServerNode = require("../../nodes/thinger-server.js");
const Server = require("../api/server.js");

helper.init(require.resolve('node-red'));

describe('bucket-export Node', function () {

    before(function(done) {
        Server.listen(8080, done);
    });

    after(function (done) {
        Server.close(done);
    });

    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });

    it('node should be loaded', function (done) {
        const flow = [{ id: "n1", type: "bucket-export", name: "bucket-export" }];
        helper.load(bucketExportNode, flow, function () {
            const n1 = helper.getNode("n1");
            try {
                assert.equal(n1.name, 'bucket-export');
                done();
            } catch(err) {
                done(err);
            }
        });
    });

    it('node should export data returning the url', function(done) {

        const flow = [
            { id: "n1", type: "bucket-export", name: "bucket-export", bucket: "test", dataType: 'csv', timestampFormat: "iso", maxTs: 1721084400000, minTs: 1721080800000, server: Config.getServerId(), wires: [["n2"]] },
            { id: "n2", type: "helper" },
            Config.getServer()
        ];

        helper.load([bucketExportNode, thingerServerNode], flow, Config.getCredentials(), function () {

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

            let expected =   {
                bucket: "test",
                data_type: "csv",
                event: "bucket_export_completed",
                file: "20240725T115334Z.thinger.test.ea-eDvNc.csv",
                max_ts: 1721084400000,
                min_ts: 1721080800000,
                timestamp_format: "iso",
                ts: 1721908097913,
                url: "https://localhost:8080/v1/users/thinger/buckets/test/exports/20240725T115334Z.thinger.test.ea-eDvNc.csv",
                user: "thinger",
                }

            n2.on("input", function (msg) {
                try {

                    assert.deepEqual(msg.payload, expected);
                    done();

                } catch (err) {
                    done(err);
                }

            });
            n1.receive({});

        });

    });

});