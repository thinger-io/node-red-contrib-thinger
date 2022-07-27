module.exports = function(RED) {

    "use strict";

    function DeviceReadNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // unregister listener on close
        node.on('input', function(msg, send, done) {

            let device = config.device || msg.device;
            let resource = config.resource || msg.resource;

            const method = 'POST';
            const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v3/users/${server.config.username}/devices/${device}/resources/${resource}`;

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
                  msg.payload = {};
                  msg.payload.device = device;
                  msg.payload.resource = resource;
                  done(e);
              });
            }
            else
              done("Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("device-read", DeviceReadNode);
};
