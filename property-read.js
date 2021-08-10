module.exports = function(RED) {

    function PropertyReadNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call property read on input
        node.on("input",function(msg) {
            let assetType = config.asset || msg.asset;
            let assetId = config[config.asset] || msg.assetId;
            let property = config.property || msg.property;

            server.readProperty(assetType, assetId, property, function(error, response, body) {
              node.send({payload: body});
            });
        });
    }

    RED.nodes.registerType("property-read", PropertyReadNode);

};
