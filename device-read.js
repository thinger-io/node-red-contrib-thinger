module.exports = function(RED) {

    function DeviceReadNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // unregister listener on close
        node.on('input', function(msg) {
            server.readDevice(config.device, config.resource, function(error, response, body){
                node.send({payload: body.out ? body.out : body.in});
            });
        });
    }

    RED.nodes.registerType("device-read", DeviceReadNode);
};