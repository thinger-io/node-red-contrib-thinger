module.exports = function(RED) {

    function DeviceStreamNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // register listener on creation
        let device = config.device || msg.device;
        let resource = config.resource || msg.resource;
        let interval = config.interval || msg.interval;

        server.registerDeviceResourceListener(device, resource, Number(interval), node);

        // unregister listener on close
        node.on('close', function(removed, done) {
            if(removed){
                server.unRegisterDeviceResourceListener(device, resource, node);
            }
            done();
        });
    }

    RED.nodes.registerType("device-stream", DeviceStreamNode);
};
