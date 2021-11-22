module.exports = function(RED) {

    function BucketWriteNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call bucket write on message reception
        node.on("input",function(msg) {

            let bucket = config.bucket || msg.bucket;
            var value = config.value || msg.payload || msg.value;
            if (typeof(value) === 'string') {
                value = JSON.parse(value);
            }

            server.writeBucket(bucket, value);
        });
    }

    RED.nodes.registerType("bucket-write", BucketWriteNode);

};