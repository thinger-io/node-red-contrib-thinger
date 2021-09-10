module.exports = function(RED) {

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
            case 'd':
                seconds = seconds * 24;
            case 'h':
                seconds = seconds * 60;
            case 'm':
                seconds = seconds * 60;
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
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call bucket read on close
        node.on("input",function(msg) {

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

            let jsonConfig = {}
            let source = config.source || msg.source;
            jsonConfig.source = source;
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

            server.createBucket(json, function(error, response, body) {
              node.send({payload: body});
            });
        });
    }

    RED.nodes.registerType("bucket-create", BucketCreateNode);
};
