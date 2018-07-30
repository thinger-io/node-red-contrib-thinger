module.exports = function(RED) {

    function DeviceInputNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // register listener on creation
        server.registerDeviceResourceListener(config.device, config.resource, Number(config.interval), node);

        // unregister listener on close
        node.on('close', function(removed, done) {
            if(removed){
                server.unRegisterDeviceResourceListener(config.device, config.resource, node);
            }
            done();
        });
    }

    RED.nodes.registerType("device-input", DeviceInputNode);
};