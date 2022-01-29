module.exports = function(RED) {

    function PropertyWriteNode(config) {
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
            var value = config.value || msg.payload || msg.value;
            if (typeof(value) === 'object') {
                value = JSON.stringify(value);
            }

            if (typeof server.writeProperty === "function") {
                server.writeProperty(asset, assetId, property, value, function(res) {
                  msg.payload = res;
                  send(msg);
                })
                .catch(e => node.error(e));
            } else
                node.error("Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("property-write", PropertyWriteNode);

};
