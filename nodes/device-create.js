module.exports = function(RED) {

    "use strict";

    const Utils = require('../lib/utils/utils');

    function DeviceCreateNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        const node = this;

        // get server configuration
        const server = RED.nodes.getNode(config.server);

        node.on("input", async function(msg, send, done) {

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

            if (typeof msg.enabled !== 'undefined') {
                data.enabled = msg.enabled;
            } else {
                data.enabled = typeof config.enabled === 'boolean' ? config.enabled : true;
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

            // Render all required templates
            data = Utils.mustacheRender(data, msg);

            let projects = config.projects && config.projects !== "[]" ? RED.util.evaluateNodeProperty(config.projects, 'json', node) : msg.projects;
            if ( typeof projects === 'object' && projects.length > 0 ) {
                projects = projects.map(project => `${server.config.username}@${project}`); // body needs username
                if ( Utils.isTemplated(projects) ) projects = Utils.mustacheRender(projects, msg);
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
                  let device = data.device;
                  if ( exists ) {
                      delete data.device;
                      delete data.type;
                      res = await server.request(node,`${url}/${device}`,'PUT',data);
                  } else {
                      res = await server.request(node, url, 'POST', data);
                  }

                  // Associate to projects
                  if (projects && projects.length !== 0) {
                    res = await server.request(node,`${url}/${device}/projects`,'PUT',projects);
                  }

                } catch(err) {
                    delete err.stack;
                    msg.payload = data;

                    if ( err.hasOwnProperty("status") )
                      msg.payload.status = err.status;

                    done(err);
                    return;
                }

                msg.payload = res.payload;
                send(msg);
                done();
            }
            else
              done("Check Thinger Server Configuration");

        });
    }

    RED.nodes.registerType("device-create", DeviceCreateNode, {
        credentials: {
            deviceCredentials: {type: "password"} // device credentials will be stored here
        }
    });

};
