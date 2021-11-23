module.exports = function(RED) {

    function EndpointCallNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call endpoint on message reception
        node.on("input",function(msg) {

            let endpoint = config.endpoint || msg.endpoint;

            if (typeof server.callEndpoint === "function")
                server.callEndpoint(endpoint, msg.payload, function(res) {
                    node.send({payload: res});
                });
            else
                node.error("endpoint-call: Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("endpoint-call", EndpointCallNode);
};
