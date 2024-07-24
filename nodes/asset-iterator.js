module.exports = function(RED) {

    "use strict";

    const Utils = require('../lib/utils/utils');

    function AssetIteratorNode(config) {

        RED.nodes.createNode(this, config);

        function handleResponse(msg, res) {
            for (const i in res) {

                let newMsg = RED.util.cloneMessage(msg.msg);
                if (res.length > 1) { // if more than one asset create new message with its own id
                    delete newMsg._msgid;
                }

                newMsg.payload = res[i];
                node.buffer.push({msg: newMsg, send: msg.send, done: msg.done});

                if (node.intervalId === -1) {
                    node.intervalId = setInterval(sendMsgFromBuffer, node.rate, node);
                    sendMsgFromBuffer(); // send 1st message without waiting for timeout
                }
            }
        }

        function sendMsgFromBuffer() {
            if (node.buffer.length === 0 && typeof node.lastSent !== 'undefined') {
              clearInterval(node.intervalId);
              node.intervalId = -1;
              node.lastSent = undefined;
              node.status({fill:"blue", shape:"dot", text:"done"});
            } else if (node.buffer.length > 0) {
              const m = node.buffer.shift();
              node.lastSent = m.msg;
              m.send(m.msg);
              node.status({fill:"blue", shape:"ring", text:node.buffer.length});
              m.done();
            }
        }

        // get node
        const node = this;

        // get server configuration
        const server = RED.nodes.getNode(config.server);

        node.intervalId = -1;
        node.buffer = [];
        node.lastSent = undefined;
        node.rate = 0;

        // call property read on input
        node.on("input", async function(msg, send, done) {
            node.status({fill:"blue", shape:"ring", text:"running"});

            let asset = (config.asset || msg.asset);

            let rateUnits = config.rateUnits || msg.rate_units || "s";
            node.rate = config.rate || msg.rate || 0;
            node.rate = (rateUnits === 's') ? parseInt(node.rate)*1000 : parseInt(node.rate);

            let queryParameters = {};

            queryParameters.name = config.filter || msg.asset_filter || "";

            queryParameters.asset_type = config.assetType || msg.asset_type;

            queryParameters.asset_group = config.assetGroup || msg.asset_group;

            queryParameters.product = config.product || msg.product;

            queryParameters.project = config.project || msg.project;

            queryParameters.count = config.count || msg.count;

            queryParameters = Utils.mustacheRender(queryParameters, msg);

            // Query parameters to string
            let queryParametersString = "";
            for (const [key, value] of Object.entries(queryParameters)) {
                if ( value ) queryParametersString += key+"="+value+"&";
            }

            if (typeof server.request === "function") {

                const assetsUrl = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v1/server/assets`;

                try {
                    let data = (await server.request(node, assetsUrl, 'GET')).payload;

                    // Set path for asset
                    let assetObj = data.find(e=>e.asset === asset)
                    if ( typeof assetObj === "undefined" )
                        throw new Error("Asset type not found");
                    let path = assetObj.paths.list;
                    const userRegex = new RegExp(`\\(\\?<user>[^)]+\\)`);
                    path = path.replace(userRegex, server.config.username);

                    const count = 50;
                    const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/${path}?count=${count}&${queryParametersString}`;

                    let index = 0;
                    let res_length = 0;

                    do {
                      const res = await server.request(node,`${url}index=${index}`,'GET');
                      res_length = res.payload.length;
                      handleResponse({msg: msg, send: send, done: done}, res.payload);
                      index += res_length;
                    } while (res_length === count);

                    if (index === 0) {
                        clearInterval(node.intervalId);
                        node.intervalId = -1;
                        node.status({fill:"blue", shape:"dot", text:"done"});
                    } else {
                        node.status({fill:"blue", shape:"ring", text:node.buffer.length});
                    }
                } catch(e) {
                    node.status({fill:"red", shape:"dot", text:"error"});
                    delete e.stack;
                    msg.payload = {};
                    msg.payload.asset = asset;
                    msg.payload.asset_filter = queryParameters.name;
                    msg.payload.asset_type = queryParameters.asset_type;
                    msg.payload.asset_group = queryParameters.asset_group;

                    if ( e.hasOwnProperty("status") )
                      msg.payload.status = e.status;

                    done(e);
                }

            } else
                done("Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("asset-iterator", AssetIteratorNode);

};
