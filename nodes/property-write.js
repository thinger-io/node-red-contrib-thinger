module.exports = function(RED) {

    function PropertyWriteNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call property read on input
        node.on("input",async function(msg, send) {
            let asset = (config.asset || msg.asset)+"s";
            let assetId = config.assetId || msg.asset_id;
            let property = config.property || msg.property;
            var data = config.value || msg.payload || msg.value;

            const apiVersion = (asset == "devices" ? "v3" : "v1");
            let url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/${apiVersion}/users/${server.config.username}/${asset}/${assetId}/properties`;

            if (typeof server.request === "function") {
                // Check if property exists
                let exists = false;
                let res;
                res = await server.request(node,`${url}`, 'GET');
                for (let i in res.payload) {
                    if (res.payload[i].property === property) {
                        exists = true;
                        break;
                    }
                }

                data = {property: property, value: (typeof data === 'object') ? data : JSON.parse(data)};

                // Update if exist or create it
                let method;
                if ( exists ) {
                    method = 'PUT';
                    url = `${url}/${property}`;
                    delete data.property;
                } else
                    method = 'POST';

                try {
                    res = await server.request(node, url, method, data);
                } catch (err) {
                    node.error(err);
                    return;
                }

                msg.payload = res.payload;
                send(msg);
            }
            else
              node.error("Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("property-write", PropertyWriteNode);

};
