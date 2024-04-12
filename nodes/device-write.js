module.exports = function(RED) {

    "use strict";

    const Utils = require('../lib/utils/utils');

    function DeviceWriteNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        const node = this;

        // get server configuration
        const server = RED.nodes.getNode(config.server);

        // call bucket write on message reception
        node.on("input",function(msg, send, done) {

            let device = config.device || msg.device;
            device = Utils.mustacheRender(device, msg);
            let resource = config.resource || msg.resource;
            resource = Utils.mustacheRender(resource, msg);
            let data = config.value || msg.payload || msg.value;
            data = Utils.mustacheRender(data, msg);

            const method = 'POST';
            const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v3/users/${server.config.username}/devices/${device}/resources/${resource}`;

            if (typeof server.request === "function") {
              server.request(node, url, method, data)
              .then(res => {

                if (res && res.length != 0) {
                  msg.payload = res.payload;
                }

                send(msg);
                done();
              })
              .catch(e => {
                  delete e.stack;
                  msg.payload = {};
                  msg.payload.device = device;
                  msg.payload.resource = resource;
                  msg.payload.data = data;

                  if ( e.hasOwnProperty("status") )
                    msg.payload.status = e.status;

                  done(e);
              });
            }
            else
              done("Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("device-write", DeviceWriteNode);
};
