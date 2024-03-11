module.exports = function(RED) {

    "use strict";

    const Utils = require('../lib/utils/utils');

    function DeviceReadNode(config) {

        RED.nodes.createNode(this, config);

        // get node
        const node = this;

        // get server configuration
        const server = RED.nodes.getNode(config.server);

        // unregister listener on close
        node.on('input', function(msg, send, done) {

            let device = config.device || msg.device;
            device = Utils.mustacheRender(device, msg);

            let resource = config.resource || msg.resource;
            resource = Utils.mustacheRender(resource, msg);

            const method = 'POST';
            const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v3/users/${server.config.username}/devices/${device}/resources/${resource}`;

            if (typeof server.request === "function") {
              server.request(node, url, method, msg.payload)
              .then(res => {
                // Throw if response fails
                if (!res.status.toString().startsWith('20')) {
                    throw res.error;
                }

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
