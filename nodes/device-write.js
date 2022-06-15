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
            var data = config.value || msg.payload || msg.value;

            const method = 'POST';
            const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v3/users/${server.config.username}/devices/${device}/resources/${resource}`;

            if (typeof server.request === "function") {
              server.request(node, url, method, data)
              .then(res => {

                 if (res && res.length != 0)
                    msg.payload = res.payload;

                  node.send(msg);
              })
              .catch(e => node.error(e));
            }
            else
              node.error("Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("device-write", DeviceWriteNode);
};
