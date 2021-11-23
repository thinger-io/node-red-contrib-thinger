module.exports = function(RED) {

    function DeviceCreateNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call device read on close
        node.on("input",function(msg) {

            let json = {};

            json.type = config.deviceType || msg.type;
            json.device = config.deviceId || msg.device;

            let credentials;
            if (this.credentials && this.credentials.hasOwnProperty("deviceCredentials")) {
                credentials = this.credentials.deviceCredentials;
            } else {
                credentials = msg.credentials;
            }
            json.credentials = credentials;

            let deviceName = config.deviceName || msg.name;
            if (deviceName) {
                json.name = deviceName;
            }

            let description = config.description || msg.description;
            if (description) {
                json.description = description;
            }

            let type = config.assetType || msg.asset_type;
            if (type) {
                json.asset_type = type;
            }

            let group = config.assetGroup || msg.asset_group;
            if (group) {
                json.asset_group = group;
            }

            if (typeof server.createDevice === "function")
                server.createDevice(json, function(res) {
                  node.send({payload: res});
                });
            else
                node.error("device-create: Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("device-create", DeviceCreateNode, {
        credentials: {
            deviceCredentials: {type: "password"} // device credentials will be stored here
        }
    });

};
