module.exports = function(RED) {

    function DeviceWriteNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call bucket write on message reception
        node.on("input",function(msg, send) {

            let device = config.device || msg.device;
            let resource = config.resource || msg.resource;
            var value = config.value || msg.payload || msg.value;
            if (typeof(value) === 'string') {
                value = JSON.parse(value);
            }

            if (typeof server.writeDevice === "function") {
                server.writeDevice(device, resource, value, function(res) {

                    if (res && res.length != 0)
                        msg.payload = res;

                    send(msg);
                })
                .catch(e => node.error(e));
            } else
                node.error("Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("device-write", DeviceWriteNode);
};
