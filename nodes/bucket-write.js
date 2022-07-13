
module.exports = function(RED) {

    "use strict";

    const Request = require('../lib/utils/request.js');

    function BucketWriteNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call bucket write on message reception
        node.on("input", function(msg, send, done) {

            let bucket = config.bucket || msg.bucket;
            var value = config.value || msg.payload || msg.value;
            if (typeof(value) === 'string') {
                value = JSON.parse(value);
            }

            const method = 'POST';
            const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v1/users/${server.config.username}/buckets/${bucket}/data`;

            if (typeof server.request === "function") {
              server.request(node, url, method, value)
                .then((res) => {

                  // Throw if response fails
                  if (!res.status.toString().startsWith('20'))
                      throw res.error;

                  done();
                })
                .catch(e => {
                  delete e.stack;
                  msg.payload = {}
                  msg.payload.bucket = bucket;
                  msg.payload.value = value;
                  done(e);
                });
            }
            else
              done("Check Thinger Server Configuration");

        });
    }

    RED.nodes.registerType("bucket-write", BucketWriteNode);

};
