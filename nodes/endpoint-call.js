module.exports = function(RED) {

    "use strict";

    const Utils = require('../lib/utils/utils');

    function EndpointCallNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        const node = this;

        // get server configuration
        const server = RED.nodes.getNode(config.server);

        // call endpoint on message reception
        node.on("input",function(msg, send, done) {

            let endpoint = config.endpoint || msg.endpoint;
            endpoint = Utils.mustacheRender(endpoint, msg);

            const method = 'POST';
            const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v1/users/${server.config.username}/endpoints/${endpoint}/call`;

            if (typeof server.request === "function") {
              server.request(node, url, method, msg.payload)
              .then(res => {

                  // Throw if response fails
                  if (!res.status.toString().startsWith('20'))
                    throw res.error;

                  msg.payload = res.payload;
                  send(msg);
                  done();
              })
              .catch(e => {
                  delete e.stack;
                  let payload = msg.payload;
                  msg.payload = {};
                  msg.payload.endpoint = endpoint;
                  msg.payload.data = payload;
                  done(e);
              });
            }
            else
              done("Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("endpoint-call", EndpointCallNode);
};
