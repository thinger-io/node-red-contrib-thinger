module.exports = function(RED) {

    function PropertyReadNode(config) {
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

            server.readProperty(asset, assetId, property, function(res) {
              node.send({payload: res});
            })
            .catch(console.log);
        });
    }

    RED.nodes.registerType("property-read", PropertyReadNode);

};
