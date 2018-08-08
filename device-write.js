module.exports = function(RED) {

    function DeviceWriteNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call bucket write on message reception
        node.on("input",function(msg) {
            console.log(msg.payload);
            server.writeDevice(config.device, config.resource, msg.payload);
        });
    }

    RED.nodes.registerType("device-write", DeviceWriteNode);
};