module.exports = function(RED) {

    function DeviceReadNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // unregister listener on close
        node.on('input', function(msg) {

            let device = config.device || msg.device;
            let resource = config.resource || msg.resource;

            server.readDevice(device, resource, function(error, response, body){
                node.send({payload: body});
            });
        });
    }

    RED.nodes.registerType("device-read", DeviceReadNode);
};
