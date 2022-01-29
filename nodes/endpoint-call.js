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

            if (typeof server.callEndpoint === "function") {

                    server.callEndpoint(endpoint, msg.payload, function(res) {
                        msg.payload = res;
                        node.send(msg);
                    })
                    .catch(e => node.error(e));

            } else
                node.error("Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("endpoint-call", EndpointCallNode);
};
