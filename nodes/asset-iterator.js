module.exports = function(RED) {

    "use strict";

    function AssetIteratorNode(config) {

        RED.nodes.createNode(this, config);

        function handleResponse(msg, res, assetType, assetGroup) {
            for (var i in res) {
                let type = res[i].asset_type;
                let group = res[i].asset_group;

                let newMsg = RED.util.cloneMessage(msg.msg);
                if (res.length > 1) { // if more than one asset create new message with its own id
                    delete newMsg._msgid;
                }

                if (
                  (assetType === undefined && assetGroup === undefined) ||
                  (assetType === type && assetGroup === group) ||
                  (assetType === type && assetGroup === undefined) ||
                  (assetType === undefined && assetGroup == group)
                ) {
                    newMsg.payload = res[i];
                } else {
                    continue;
                }

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
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        node.intervalId = -1;
        node.buffer = [];
        node.lastSent = undefined;
        node.rate = 0;

        // call property read on input
        node.on("input", async function(msg, send, done) {
            node.status({fill:"blue", shape:"ring", text:"running"});

            let asset = (config.asset || msg.asset)+"s";
            let filter = config.filter || msg.asset_filter || "";

            let rateUnits = config.rateUnits || msg.rate_units || "s";
            node.rate = config.rate || msg.rate || 0;
            node.rate = (rateUnits === 's') ? parseInt(node.rate)*1000 : parseInt(node.rate);

            let assetType = config.assetType || msg.asset_type;
            let assetGroup = config.assetGroup || msg.asset_group;

            if (typeof server.request === "function") {

                const assetsUrl = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v1/server/assets`;

                let data = (await server.request(node, assetsUrl, 'GET')).payload;

                let user = "";
                for (let i in data) {
                    if (`${data[i].asset}s` === asset && data[i].role === "user")
                        user = `users/${server.config.username}/`;
                }

                const count = 50;
                const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v1/${user}${asset}?name=${filter}&count=${count}`;

                let index = 0;
                let res_length = 0;

                try {
                    do {
                      const res = await server.request(node,`${url}&index=${index}`,'GET');
                      res_length = res.payload.length;
                      handleResponse({msg: msg, send: send, done: done}, res.payload, assetType, assetGroup);
                      index += res_length;
                    } while (res_length == count);

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
                    msg.payload.asset_filter = filter;
                    msg.payload.asset_type = assetType;
                    msg.payload.asset_group = assetGroup;
                    done(e);
                }

            } else
                done("Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("asset-iterator", AssetIteratorNode);

};
