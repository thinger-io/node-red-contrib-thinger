module.exports = function(RED) {

    function DeviceCreateNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        node.on("input", async function(msg, send) {

            let data = {};

            let deviceType = config.deviceType || msg.type;
            if (deviceType !== undefined)
                data.type = deviceType;
            data.device = config.deviceId || msg.device;

            let credentials;
            if (this.credentials && this.credentials.hasOwnProperty("deviceCredentials")) {
                credentials = this.credentials.deviceCredentials;
            } else {
                credentials = msg.credentials;
            }
            if (credentials !== undefined)
                data.credentials = credentials;

            let deviceName = config.deviceName || msg.name;
            if (deviceName) {
                data.name = deviceName;
            }

            let description = config.description || msg.description;
            if (description) {
                data.description = description;
            }

            let type = config.assetType || msg.asset_type;
            if (type) {
                data.asset_type = type;
            }

            let group = config.assetGroup || msg.asset_group;
            if (group) {
                data.asset_group = group;
            }

            let product = config.product || msg.product;
            if (product) {
                data.product = product;
            }

            // It fails when no credentials are passed as expected by the backend
            const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v1/users/${server.config.username}/devices`;

            if (typeof server.request === "function") {
                // Check if device exists
                let exists = true;
                let res;
                res = await server.request(node,`${url}/${data.device}`, 'GET');
                if (res.status !== 200)
                    exists = false;

                // Update if exist or create it
                try {
                  if ( exists ) {
                      let device = data.device;
                      delete data.device;
                      delete data.type;
                      res = await server.request(node,`${url}/${device}`,'PUT',data);
                  } else {
                      res = await server.request(node, url, 'POST', data);
                  }
                } catch(err) {
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

    RED.nodes.registerType("device-create", DeviceCreateNode, {
        credentials: {
            deviceCredentials: {type: "password"} // device credentials will be stored here
        }
    });

};
