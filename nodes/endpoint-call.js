module.exports = function(RED) {

    function EndpointCallNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call endpoint on message reception
        node.on("input",function(msg, send) {

            let endpoint = config.endpoint || msg.endpoint;

            const method = 'POST';
            const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v1/users/${server.config.username}/endpoints/${endpoint}/call`;

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

    RED.nodes.registerType("endpoint-call", EndpointCallNode);
};
