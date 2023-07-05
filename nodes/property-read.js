module.exports = function(RED) {

    "use strict";

    function PropertyReadNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        const node = this;

        // get server configuration
        const server = RED.nodes.getNode(config.server);

        // call property read on input
        node.on("input",function(msg, send, done) {
            let asset = (config.asset || msg.asset)+"s";
            let assetId = config.assetId || msg.asset_id;
            let property = config.property || msg.property;

            const method = 'GET';
            const apiVersion = (asset == "devices" ? "v3" : "v1");
            const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/${apiVersion}/users/${server.config.username}/${asset}/${assetId}/properties/${property}`;

            if (typeof server.request === "function") {

              server.request(node, url, method)
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
                  msg.payload.asset = asset;
                  msg.payload.asset_id = assetId;
                  msg.payload.property = property;
                  done(e);
              });
            }
            else
              done("Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("property-read", PropertyReadNode);

};
