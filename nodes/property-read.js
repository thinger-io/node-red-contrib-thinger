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

            const method = 'GET';
            const apiVersion = (asset == "devices" ? "v3" : "v1");
            const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/${apiVersion}/users/${server.config.username}/${asset}/${assetId}/properties/${property}`;

            if (typeof server.request === "function") {
              server.request(node, url, method)
              .then(res => {
                  msg.payload = res.payload;
                  node.send(msg);
              })
              .catch(e => node.error(e));
            }
            else
              node.error("Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("property-read", PropertyReadNode);

};
