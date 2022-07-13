module.exports = function(RED) {

    "use strict";

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

        if (typeof server.registerDeviceResourceListener === "function")
            server.registerDeviceResourceListener(device, resource, Number(interval), node);
        else
            node.error("Check Thinger Server Configuration"); // Not done object at this point

        // unregister listener on close
        node.on('close', function(removed, done) {
            if(removed){
                if (typeof server.unRegisterDeviceResourceListener === "function")
                    server.unRegisterDeviceResourceListener(device, resource, node);
                else
                    done("Check Thinger Server Configuration");
            }
            done();
        });
    }

    RED.nodes.registerType("device-stream", DeviceStreamNode);
};
