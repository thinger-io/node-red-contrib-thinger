const Request = require('../lib/utils/request.js');

module.exports = function(RED) {

    function BucketWriteNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call bucket write on message reception
        node.on("input", function(msg) {

            let bucket = config.bucket || msg.bucket;
            var value = config.value || msg.payload || msg.value;
            if (typeof(value) === 'string') {
                value = JSON.parse(value);
            }

            const method = 'POST';
            const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v1/users/${server.config.username}/buckets/${bucket}/data`;

            if (typeof server.request === "function") {
              server.request(node, url, method, value).catch(e => node.error(e));
            }
            else
              node.error("Check Thinger Server Configuration");

        });
    }

    RED.nodes.registerType("bucket-write", BucketWriteNode);

};
