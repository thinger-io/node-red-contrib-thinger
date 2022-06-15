module.exports = function(RED) {

    async function provisionDevice(server,node,prefix,device,assetType,assetGroup) {
        // create auto provisioned device
        let data = {};
        data.type = "HTTP";
        data.device = prefix+device;
        data.name = device;
        data.description = "Auto provisioned Node-RED Device"
        if (assetType) {
            data.asset_type = assetType;
        }
        if (assetGroup) {
            data.asset_group = assetGroup;
        }

        let url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v1/users/${server.config.username}/devices`;

        let res = await server.request(node,url,'POST',data);
        if ( !res ) {
            return new Error(`Could not create device on device callback auto provisioning`);
        }

        // set write bucket action for callback
        const dataAction = {
          "actions": {
            "write_bucket": device
          }
        };

        url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v3/users/${server.config.username}/devices/${device}/callback`;
        res = await server.request(node,url,'PUT',dataAction);
        if ( !res ) {
            return new Error(`Could not configure device callback to write bucket action`);
        }

    }

    async function provisionBucket(server,node,prefix,device,assetType,assetGroup) {
        // create auto provisioned bucket
        let data = {};
        data.bucket = prefix+device;
        data.name = device;
        data.description = "Auto provisioned Node-RED Bucket";
        data.enabled = true;
        data.config = {"source": "api"}
        if (assetType) {
            data.asset_type = assetType;
        }
        if (assetGroup) {
            data.asset_group = assetGroup;
        }

        const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v1/users/${server.config.username}/buckets`;

        try {
            await server.request(node, url, 'POST', data) // There is no response
        } catch(e) {
            return new Error(`Could not create bucket on device callback auto provisioning`);
        }
    }

    function DeviceCallbackNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call bucket write on message reception
        node.on("input",async function(msg, send) {

            let device = config.device || msg.device;

            let assetType = msg.asset_type || "";

            let assetGroup = msg.asset_group || "";

            let prefix = "";
            if (msg.prefix || (msg.device && !config.device)) {
                prefix = msg.prefix ? msg.prefix : "NR_";
            }

            var data = config.body || msg.payload || msg.body;
            if (typeof(data) === 'string') {
                data = JSON.parse(data);
            }

            if (typeof server.request === "function") {

                const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v3/users/${server.config.username}/devices/${device}/callback`;

                // Check if device exists if not autoprovision resources
                const res1 = await server.request(node,url,'GET');
                if ( !res1.payload ) {

                    await provisionBucket(server,node,prefix,device,assetType,assetGroup);
                    await provisionDevice(server,node,prefix,device,assetType,assetGroup);
                }

                const res = await server.request(node,`${url}/data`,'POST',data);
                msg.payload = res.payload;
                node.send(msg);

            } else
                node.error("Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("device-callback", DeviceCallbackNode);
};
