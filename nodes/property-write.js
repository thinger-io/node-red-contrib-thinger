const Utils = require("../lib/utils/utils");
module.exports = function(RED) {

    "use strict";

    const Utils = require('../lib/utils/utils.js');

    function PropertyWriteNode(config) {

        RED.nodes.createNode(this, config);

        // get node
        const node = this;

        // get server configuration
        const server = RED.nodes.getNode(config.server);

        // call property read on input
        node.on("input",async function(msg, send, done) {
            let asset = (config.asset || msg.asset)+"s";

            let assetId = config.assetId || msg.asset_id;
            assetId = Utils.mustacheRender(assetId, msg);

            let property = config.property || msg.property;
            property = Utils.mustacheRender(property, msg);

            let data = Utils.transformValue(config.value);
            if ( data === null ) {
                if ( typeof msg.payload !== 'undefined' ) {
                    data = Utils.transformValue(msg.payload);
                }
                else if ( typeof msg.value !== 'undefined' ) {
                    data = Utils.transformValue(msg.payload);
                }
            }
            data = Utils.mustacheRender(data, msg);

            const apiVersion = (asset == "devices" ? "v3" : "v1");
            let url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/${apiVersion}/users/${server.config.username}/${asset}/${assetId}/properties`;

            if (typeof server.request === "function") {
                // TODO: check if device exists? if not it returns a 500

                // Check if property exists
                let exists = false;
                let res;

                try {
                    res = await server.request(node,`${url}`, 'GET');
                    for (let i in res.payload) {
                        if (res.payload[i].property === property) {
                            exists = true;
                            break;
                        }
                    }

                    if (typeof data === 'undefined' || (typeof data !== 'object' && data.length === 0))
                        throw new Error("Property value cannot be empty");

                    data = {property: property, value: (typeof data === 'object') ? data : JSON.parse(data)};

                    // Update if exist or create it
                    let method;
                    if ( exists ) {
                      method = 'PUT';
                      url = `${url}/${property}`;
                      delete data.property;
                    } else
                      method = 'POST';

                    res = await server.request(node, url, method, data);
                } catch (err) {
                    delete err.stack;
                    msg.payload = {};
                    msg.payload.asset = asset;
                    msg.payload.asset_id = assetId;
                    msg.payload.property = property;
                    msg.payload.data = data;
                    done(err);
                    return;
                }

                msg.payload = res.payload;
                send(msg);
                done();
            }
            else
              done("Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("property-write", PropertyWriteNode);

};
