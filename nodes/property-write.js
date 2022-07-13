module.exports = function(RED) {

    "use strict";

    function PropertyWriteNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call property read on input
        node.on("input",async function(msg, send, done) {
            let asset = (config.asset || msg.asset)+"s";
            let assetId = config.assetId || msg.asset_id;
            let property = config.property || msg.property;
            var data = config.value || msg.payload || msg.value;

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
                        throw "Property value cannot be empty";

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
