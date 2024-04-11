module.exports = function(RED) {

    "use strict";

    const Utils = require('../lib/utils/utils.js');

    function StorageWriteNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        const node = this;

        // get server configuration
        const server = RED.nodes.getNode(config.server);

        // unregister listener on close
        node.on('input', async function(msg, _send, done) {

            let storage = config.storage || msg.storage;
            storage = Utils.mustacheRender(storage, msg);

            let file = config.file || msg.file || "";
            file = file.replace(/^\//, ''); // remove leading /
            file = Utils.mustacheRender(file, msg);

            let action = msg.action || config.action || "append";
            let appendNewLine = msg.append_new_line || config.appendNewLine || false;
            let createDir = msg.create_dir || config.createDir || false;

            const method = 'GET';
            const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v1/users/${server.config.username}/storages/${storage}/files`;

            if (typeof server.request === "function") {

              try {

                  // Get all files of storage
                  let res = await server.request(node, url, method);

                  // Check if file and directory exist
                  // Clean file list only to what we need
                  let files = res.payload.filter(e => e.path.startsWith(file));
                  if (files.length === 1 && file[0].type === "directory") // file exists
                      throw new Error("File is a directory");

                  else if (files.length > 1) { // file might have the same name as a folder
                      throw new Error("File is a directory");
                  } else if (files.length === 0) {
                      // File or path does not exist. Create?
                      if (createDir) {
                          // Recursively create path
                          const regex = /\//g;
                          let fileDepth = (file.match(regex) || []).length;
                          let i = 1;

                          while (i <= fileDepth+1) {
                              // Check if subpath exists and create it
                              let path = file.split('/').slice(0,i);
                              let exists = res.payload.filter(e => e.path.startsWith(path.join('/'))).length > 0;
                              if ( !exists ) {
                                  let type = `${i === fileDepth+1 ? "files" : "folders"}`;
                                  let body = {};
                                  body[type] = [path[i-1]];
                                  await server.request(node, `${url}${i>1 ? '/' : ''}${file.split('/').slice(0,i-1).join('/')}`, 'POST', body);
                              }
                              i++;
                          }
                      } else {
                          throw new Error("File or directory does not exist");
                      }
                  }

                  // Append, orverwrite or delete
                  let newContent = msg.payload;
                  if (appendNewLine) {
                      if (Buffer.isBuffer(msg.payload)) newContent = Buffer.concat([msg.payload, Buffer.from('\n')]);
                      else if (Utils.isBase64(msg.payload)) newContent = msg.payload+Buffer.from('\n','utf-8').toString('base64');
                      else newContent = msg.payload+'\n';
                  }

                  try {
                      if (action === "append") {
                          let content = (await server.request(node, `${url}/${file}`, method)).payload;
                          if (Buffer.isBuffer(content)) {
                              if (Buffer.isBuffer(newContent)) msg.payload = Buffer.concat([content, newContent]);
                              else msg.payload = `${content.toString('utf-8')}${newContent}`;
                          } else if (Buffer.isBuffer(newContent)) {
                              msg.payload = `${content}${newContent.toString('utf-8')}`;
                          } else {
                              msg.payload = `${content}${newContent}`;
                          }

                          msg.payload = await server.request(node, `${url}/${file}`, 'PUT', msg.payload).payload;
                      } else if (action === "overwrite") {
                          msg.payload = await server.request(node, `${url}/${file}`, 'PUT', newContent).payload;
                      } else if (action === "delete") {
                          msg.payload = await server.request(node, `${url}/${file}`, 'DELETE').payload;
                      } else {
                          throw new Error("File action is not recognized");
                      }
                  } catch ( e ) {
                      delete e.stack;
                      done(e);

                      return;
                  }

                  //send(msg);
                  done();

              } catch(e) {
                  msg.payload = {};
                  msg.payload.storage = storage;
                  msg.payload.file = file;
                  msg.payload.action = action;
                  msg.payload.append_new_line = appendNewLine;
                  msg.payload.create_dir = createDir;

                  if ( e.hasOwnProperty("status") )
                    msg.payload.status = e.status;

                  done(e);
                  return;
              }

            }
            else
              done("Check Thinger Server Configuration");
        });
    }

    RED.nodes.registerType("storage-write", StorageWriteNode);
};
