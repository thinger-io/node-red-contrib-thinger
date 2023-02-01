module.exports = function(RED) {

    "use strict";

    function DeviceWriteNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call bucket write on message reception
        node.on("input",function(msg, send, done) {

            let device = config.device || msg.device;
            let resource = config.resource || msg.resource;
            let data = config.value || msg.payload || msg.value;

            const method = 'POST';
            const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v3/users/${server.config.username}/devices/${device}/resources/${resource}`;

            if (typeof server.request === "function") {
              server.request(node, url, method, data)
              .then(res => {

                // Throw if response fails
                if (!res.status.toString().startsWith('20'))
                  throw res.error;

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
                  done(e);
              });
            }
            else
              done("Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("device-write", DeviceWriteNode);
};
