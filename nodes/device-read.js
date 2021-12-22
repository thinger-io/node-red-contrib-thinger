module.exports = function(RED) {

    function DeviceReadNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // unregister listener on close
        node.on('input', function(msg, send) {

            let device = config.device || msg.device;
            let resource = config.resource || msg.resource;

            if (typeof server.readDevice === "function")
                server.readDevice(device, resource, function(res){
                    msg.payload = res;
                    send(msg);
                });
            else
                node.error("device-read: Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("device-read", DeviceReadNode);
};
