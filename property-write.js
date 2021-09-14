module.exports = function(RED) {

    function PropertyWriteNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call property read on input
        node.on("input",function(msg) {
            let asset = (config.asset || msg.asset)+"s";
            let assetId = config.assetId || msg.asset_id;
            let property = config.property || msg.property;
            var value = config.value || msg.payload || msg.value;
            if (typeof(value) === 'object') {
                value = JSON.stringify(value);
            }

            server.writeProperty(asset, assetId, property, value, function(res) {
              node.send({payload: res});
            })
            .catch(console.log);
        });
    }

    RED.nodes.registerType("property-write", PropertyWriteNode);

};
