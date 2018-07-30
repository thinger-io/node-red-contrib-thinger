module.exports = function(RED) {

    function BucketWriteNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call bucket write on message reception
        node.on("input",function(msg) {
            server.writeBucket(config.bucket, msg.payload);
        });
    }

    RED.nodes.registerType("bucket-write", BucketWriteNode);
};