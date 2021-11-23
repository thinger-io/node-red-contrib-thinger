module.exports = function(RED) {

    function AssetIteratorNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call property read on input
        node.on("input",function(msg) {
            let asset = (config.asset || msg.asset)+"s";
            let filter = config.filter || msg.asset_filter;

            let assetType = config.assetType || msg.asset_type;
            let assetGroup = config.assetGroup || msg.asset_group;

            if (typeof server.iterateAssets === "function")
                server.iterateAssets(asset, filter, function(res) {
                  for (var i in res) {
                      let type = res[i].asset_type;
                      let group = res[i].asset_group;

                      if (assetType === undefined && assetGroup === undefined) {
                          node.send({payload: res[i]});
                      } else if (assetType === type && assetGroup === group) {
                          node.send({payload: res[i]});
                      } else if (assetType === type && assetGroup === undefined) {
                          node.send({payload: res[i]});
                      } else if (assetType === undefined && assetGroup == group) {
                          node.send({payload: res[i]});
                      }
                  }
                });
            else
                node.error("asset-iterator: Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("asset-iterator", AssetIteratorNode);

};
