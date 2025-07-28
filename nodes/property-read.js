module.exports = function(RED) {

    "use strict";

    const Utils = require('../lib/utils/utils');

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
            assetId = Utils.mustacheRender(assetId, msg);
            let property = config.property || msg.property;
            property = Utils.mustacheRender(property, msg);

            const method = 'GET';
            const apiVersion = (asset == "devices" ? "v3" : "v1");
          console.log("shit8");
            const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/${apiVersion}/users/${server.config.username}/${asset}/${assetId}/properties/${property}`;
          console.log("shit9");

            if (typeof server.request === "function") {

              server.request(node, url, method)
              .then(res => {

                  msg.payload = res.payload;
                  send(msg);
                  done();
              })
              .catch(e => {
                console.log("hola");
                  delete e.stack;
                  msg.payload = {};
                  msg.payload.asset = asset;
                  msg.payload.asset_id = assetId;
                  msg.payload.property = property;

                  if ( e.hasOwnProperty("status") )
                    msg.payload.status = e.status;

                  done(e);
              });
            }
            else
              done("Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("property-read", PropertyReadNode);

};
