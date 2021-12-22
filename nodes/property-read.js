module.exports = function(RED) {

    function PropertyReadNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call property read on input
        node.on("input",function(msg, send) {
            let asset = (config.asset || msg.asset)+"s";
            let assetId = config.assetId || msg.asset_id;
            let property = config.property || msg.property;

            if (typeof server.readProperty === "function")
                server.readProperty(asset, assetId, property, function(res) {
                  msg.payload = res;
                  send(msg);
                });
            else
                node.error("property-read: Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("property-read", PropertyReadNode);

};
