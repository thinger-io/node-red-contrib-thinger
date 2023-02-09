module.exports = function(RED) {

    "use strict";

    async function provisionDevice(server,node,prefix,device,assetType,assetGroup,product) {
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
        if (product) {
            data.product = product;
        }

        let url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v1/users/${server.config.username}/devices`;

        let res = await server.request(node,url,'POST',data);
        if ( !res ) {
            return new Error(`Could not create device on device callback auto provisioning`);
        }

        // set write bucket action for callback
        const dataAction = {
          "actions": {
            "write_bucket": `${prefix}${device}`
          }
        };

        url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v3/users/${server.config.username}/devices/${prefix}${device}/callback`;
        res = await server.request(node,url,'PUT',dataAction);
        if ( !res ) {
            return new Error(`Could not configure device callback to write bucket action`);
        }

    }

    async function provisionBucket(server,node,prefix,device,assetType,assetGroup,product) {
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
        if (product) {
            data.product = product;
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
        node.on("input",async function(msg, send, done) {

            let device = config.device || msg.device;

            let assetType = msg.asset_type || "";

            let assetGroup = msg.asset_group || "";

            let product = msg.product || "";

            let prefix = "";
            if (msg.hasOwnProperty(prefix) || (msg.device && !config.device)) {
                prefix = msg.hasOwnProperty("prefix") ? msg.prefix : "NR_";
            }

            let data = config.body || msg.payload || msg.body;
            if (typeof(data) === 'string') {
                data = JSON.parse(data);
            }

            if (typeof server.request === "function") {

                try {
                    const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v3/users/${server.config.username}/devices/${prefix}${device}/callback`;

                    // Check if device exists if not autoprovision resources
                    let res = await server.request(node,`${url}/data`,'POST',data);
                    if ( res.status !== 200 ) {

                        await provisionBucket(server,node,prefix,device,assetType,assetGroup,product);
                        await provisionDevice(server,node,prefix,device,assetType,assetGroup,product);
                        res = await server.request(node,`${url}/data`,'POST',data);

                    }

                    msg.payload = res.payload;
                    send(msg);
                    done();

                } catch(err) {
                    delete err.stack;
                    msg.payload = {};
                    msg.payload.device = device;
                    msg.payload.assetType = assetType;
                    msg.payload.assetGroup = assetGroup;
                    msg.payload.product = product;
                    msg.payload.prefix = prefix;
                    msg.payload.data = data;
                    done(err);
                }
            } else
                done("Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("device-callback", DeviceCallbackNode);
};
