module.exports = function(RED) {

    function StorageReadNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // unregister listener on close
        node.on('input', async function(msg, send) {

            let storage = config.storage || msg.storage;
            let file = config.file || msg.file || "";
            let data = config.data || msg.data || "content";
            let recursive = config.recursive || msg.recursive || false;
            let minDepth = config.minDepth || msg.min_depth || 0;
            let maxDepth = config.maxDepth || msg.max_depth || -1;
            minDepth = parseInt(minDepth);
            maxDepth = parseInt(maxDepth);

            const method = 'GET';
            const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v1/users/${server.config.username}/storages/${storage}/files`;

            if (typeof server.request === "function") {

              // Get all files of storage
              let res = await server.request(node, url, method);
              if (res.status !== 200) {
                  node.error(res.error);
                  return;
              }

              // Clean file list only to what we need
              let files = res.payload.filter(e => e.path.startsWith(file));
              const regex = /[/]/g;
              let fileDepth = (file.match(regex) || []).length;

              // When not recursive show files from path
              if (!recursive) {
                  files = files.filter(e => (e.path.match(regex) || []).length <= fileDepth);
              } else {
                  if (maxDepth != -1)
                    files = files.filter(e =>
                      (e.path.match(regex) || []).length >= fileDepth+minDepth &&
                      (e.path.match(regex) || []).length <= fileDepth+maxDepth+1
                    );
                  else
                    files = files.filter(e => (e.path.match(regex) || []).length >= fileDepth+minDepth);
              }

              // Get file contents if required
              if (data === "content") {
                  for (i in files) {
                      if (files[i].type === "file")
                          files[i].content = (await server.request(node, `${url}/${files[i].path}`, method)).payload;
                  }
              }

              // When only one file and content selected, content should be payload
              if (files.length === 1)
                  if (data === "content")
                      msg.payload = files[0].content;
                  else
                      msg.payload = files[0];
              else
                  msg.payload = files;

              node.send(msg);

            }
            else
              node.error("Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("storage-read", StorageReadNode);
};
