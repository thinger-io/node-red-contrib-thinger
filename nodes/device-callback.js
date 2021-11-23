module.exports = function(RED) {

    function DeviceCallbackNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call bucket write on message reception
        node.on("input",function(msg) {

            let device = config.device || msg.device;

            let assetType = ""
            if (msg.asset_type) {
                json.asset_type = msg.asset_type;
            }

            let assetGroup = ""
            if (msg.asset_group) {
                json.asset_group = msg.asset_group;
            }

            let prefix = "";
            if (msg.prefix || (msg.device && !config.device)) {
                prefix = msg.prefix ? msg.prefix : "NR_";
            }

            var body = config.body || msg.payload || msg.body;
            if (typeof(body) === 'string') {
                body = JSON.parse(body);
            }

            if (typeof server.callbackDevice === "function")
                server.callbackDevice(device, assetType, assetGroup, prefix, body, function(res) {
                    node.send({payload: res});
                });
            else
                node.error("device-callback: Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("device-callback", DeviceCallbackNode);
};
