module.exports = function(RED) {

    function AssetIteratorNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call property read on input
        node.on("input",function(msg, send) {
            let asset = (config.asset || msg.asset)+"s";
            let filter = config.filter || msg.asset_filter;

            let assetType = config.assetType || msg.asset_type;
            let assetGroup = config.assetGroup || msg.asset_group;

            let multipleMatch = false;

            if (typeof server.iterateAssets === "function")
                server.iterateAssets(asset, filter, function(res) {
                  for (var i in res) {
                      let type = res[i].asset_type;
                      let group = res[i].asset_group;

                      let newMsg = {};
                      if (multipleMatch || res.length > 1) { // if more than one asset create new message with its own id
                          multipleMatch = true;
                          Object.assign(newMsg, msg);
                          delete newMsg._msgid;
                      }

                      if (assetType === undefined && assetGroup === undefined) {
                          newMsg.payload = res[i];
                          send(newMsg);
                      } else if (assetType === type && assetGroup === group) {
                          newMsg.payload = res[i];
                          send(newMsg);
                      } else if (assetType === type && assetGroup === undefined) {
                          newMsg.payload = res[i];
                          send(newMsg);
                      } else if (assetType === undefined && assetGroup == group) {
                          newMsg.payload = res[i];
                          send(newMsg);
                      }
                  }
                });
            else
                node.error("asset-iterator: Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("asset-iterator", AssetIteratorNode);

};
