module.exports = function(RED) {

    "use strict";

    const Utils = require('../lib/utils/utils');

    /**
     * Will return the interval passed as (1s, 1m) in seconds
     */
    function toSeconds(interval) {
        let seconds = Number(interval.slice(0,-1));
        switch (interval.slice(-1)) {
            case 'y':
                seconds = seconds * 365 * 24 * 60 * 60;
                break;
            case 'w':
                seconds = seconds * 7;
                // fall through
            case 'd':
                seconds = seconds * 24;
                // fall through
            case 'h':
                seconds = seconds * 60;
                // fall through
            case 'm':
                seconds = seconds * 60;
                break;
            case 's':
                //seconds = seconds;
                break;
            default:
                // TODO: handle error, at the moment it will fail from the thinger server side
                return interval;
        }
        return seconds;
    }

    function BucketCreateNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        const node = this;

        // get server configuration
        const server = RED.nodes.getNode(config.server);

        // call bucket read on close
        node.on("input", async function(msg, send, done) {

            let json = {};

            json.bucket = config.bucketId || msg.id;
            json.name = config.bucket || msg.bucket;
            json.description = config.description || msg.description;
            if (typeof msg.enabled !== 'undefined') {
                json.enabled = msg.enabled;
            } else {
                json.enabled = config.enabled;
            }
            let type = config.assetType || msg.asset_type;
            if (type) {
                json.asset_type = type;
            }
            let group = config.assetGroup || msg.asset_group;
            if (group) {
                json.asset_group = group;
            }

            let product = config.product || msg.product;
            if (product) {
                json.product = product;
            }

            let jsonConfig = {}
            let source = config.source || msg.source;
            jsonConfig.source = source;
            let tags = config.tags && config.tags !== "[]" ? RED.util.evaluateNodeProperty(config.tags, 'json', node) : msg.tags;
            if (tags && tags.length !== 0) {
              jsonConfig.tags = tags;
            }
            if (source == "device") {
                jsonConfig.device = config.extraSource || msg.extra_source || msg.device;
                jsonConfig.resource = config.resource || msg.resource;
                let update = config.update || msg.update;
                if (update == "interval" || update == "events") {
                    jsonConfig.update = update;
                    if (update == "interval") { // in seconds
                        let interval = config.interval || msg.interval;
                        if (typeof interval === 'number') {
                            jsonConfig.interval = interval;
                        } else {
                            jsonConfig.interval = toSeconds(interval);
                        }
                    }
                }
            } else if (source == "mqtt") {
                jsonConfig.topic = config.extraSource || msg.extra_source || msg.topic;
            }
            json.config = jsonConfig;

            // Render all required templates
            json = Utils.mustacheRender(json, msg);

            let projects = config.projects && config.projects !== "[]" ? RED.util.evaluateNodeProperty(config.projects, 'json', node) : msg.projects;
            if ( typeof projects === 'object' && projects.length > 0 )
              projects = projects.map(project => `${server.config.username}@${project}`); // body needs username

            const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v1/users/${server.config.username}/buckets`;

            if (typeof server.request === "function") {

                // Check if bucket exists
                let exists = true;
                let res;

                try {
                    res = await server.request(node,`${url}/${json.bucket}`, 'GET');
                } catch (err) {
                } finally {
                    if ( !res || res.status !== 200 )
                        exists = false;
                }

                try {

                    // Update if exist or create it
                    let bucket = json.bucket;
                    if ( exists ) {
                        delete json.bucket;
                        res = await server.request(node,`${url}/${bucket}`,'PUT',json);
                    } else {
                        res = await server.request(node, url, 'POST', json);
                    }

                    // Associate to projects
                    if (projects && projects.length !== 0) {
                        res = await server.request(node,`${url}/${bucket}/projects`,'PUT',projects);
                    }

                } catch(err) {
                    delete err.stack;
                    msg.payload = json;

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

    RED.nodes.registerType("bucket-create", BucketCreateNode);
};
