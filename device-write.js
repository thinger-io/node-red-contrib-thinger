module.exports = function(RED) {

    function DeviceWriteNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call bucket write on message reception
        node.on("input",function(msg) {

            let device = config.device || msg.device;
            let resource = config.resource || msg.resource;
            var value = config.value || msg.payload || msg.value;
            if (typeof(value) === 'string') {
                value = JSON.parse(value);
            }

            server.writeDevice(device, resource, value, function(error, response, body) {
                node.send({payload: body});
            });
        });
    }

    RED.nodes.registerType("device-write", DeviceWriteNode);
};
