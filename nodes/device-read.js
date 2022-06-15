module.exports = function(RED) {

    function DeviceReadNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // unregister listener on close
        node.on('input', function(msg, send) {

            let device = config.device || msg.device;
            let resource = config.resource || msg.resource;

            const method = 'POST';
            const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v3/users/${server.config.username}/devices/${device}/resources/${resource}`;

            if (typeof server.request === "function") {
              server.request(node, url, method, msg.payload)
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

    RED.nodes.registerType("device-read", DeviceReadNode);
};
