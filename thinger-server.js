const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const http = require('http');
const https = require('https');

module.exports = function(RED) {

    const RECONNECT_TIMEOUT_MS = 10000;
    let devices = {};
    let config = undefined;
    let token = undefined;
    let timeout = undefined;
    let node = this;

    let websockets = {};

    function handleReconnection(){
        for(let id in devices){
            let device = devices[id];
            if(device.wss && (device.wss.readyState === device.wss.CLOSED)){
                device.wss = getDeviceWebsocket(id);
            }
        }
    }

    function closeWebsockets(){
        for(let id in devices){
            let device = devices[id];
            if(device.wss){
                device.wss.close();
            }
        }
    }

    async function request(url, method, data = {}) {

        var adapterFor = (function() {
            var url = require('url'),
              adapters = {
                'http:': require('http'),
                'https:': require('https'),
            };

            return function(inputUrl) {
              return adapters[url.parse(inputUrl).protocol]
            }
        }());

        const options = {
          method: method,
          headers: {
            'Authorization': 'Bearer '+token,
            'Content-Type': 'application/json'
          },
          timeout: 1000, // in ms
        };

        const dataString = JSON.stringify(data);
        if (method === "POST" || method === "PUT") {
            options.headers['Content-Length'] = dataString.length;
        }

        return new Promise((resolve, reject) => {
          const req = adapterFor(url).request(url, options, (res) => {
            console.log(`${res.statusCode} ${method} ${url}`);
            //if (res.statusCode < 200 || res.statusCode > 299) {
            //  return reject(new Error(`HTTP status code ${res.statusCode}`));
            //}

            const body = [];
            res.on('data', (chunk) => body.push(chunk));
            res.on('end', () => {
              const res = Buffer.concat(body).toString();
              resolve(!res ? res : JSON.parse(res));
            });
          });

          req.on('error', (err) => {
            reject(err);
          });

          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request time out'));
          });

          if (method === "POST" || method === "PUT") {
              req.write(dataString);
          }

          req.end();
        });
    }

    function ThingerServerNode(configa) {
        RED.nodes.createNode(this, configa);

        node = this;
        config = configa;

        if(this.credentials && this.credentials.hasOwnProperty("token")) {
            let provided_token = this.credentials.token;
            // get the decoded payload and header
            let decoded = jwt.decode(provided_token, {complete: true});
            if (decoded && decoded.payload.usr) {
                config.username = decoded.payload.usr;
                configa.token = provided_token;
                token = provided_token
            } else {
                node.error("Invalid JWT Token");
                return;
            }
        }else{
            node.error("Please, provide the Access Token");
            return;
        }

        node.on('close', function(removed, done) {
            // clear reconnection timeout
            clearTimeout(timeout);

            // close device connections
            closeWebsockets();

            done();
        });

        node.openWebsocket = function(node, path, on_open, on_message, on_close, on_error){
            const url = (config.ssl ? 'wss://' : "ws://") + config.host + "/v1/users/" + config.username + path + "?authorization=" + config.token;
            node.log("opening websocket to: " + url);
            let wss = new WebSocket(url);

            wss.on('error', function(e){
                node.status({fill:"red", shape:"dot", text: 'websocket error'});
                node.error(e && e.message ? e.message : "websocket error");
                if(on_error) on_error(e);
            });

            wss.on('open', function open() {
                node.status({fill:"green", shape:"dot", text: 'connected'});
                if(on_open) on_open();
            });

            wss.on('message', function incoming(data) {
                // parse incoming data
                let payload = JSON.parse(data);
                node.status({fill:"blue",shape:"dot",text:"connected"});
                if(on_message) on_message(payload);
                node.status({fill:"green",shape:"dot",text:"connected"});
            });

            wss.on('close', function close() {
                node.status({fill:"red", shape:"dot", text: 'disconnected'});
                if(on_close) on_close();
            });

            return wss;
        };

        node.callEndpoint = async function(endpointId, data, handler){

            const url = (config.ssl ? 'https://' : "http://") + config.host + "/v1/users/" + config.username + "/endpoints/" + endpointId + "/call";
            const res = await request(url, 'POST', data);
            handler(res);
        };

        node.createBucket = async function(data, handler){
            const url = (config.ssl ? 'https://' : "http://") + config.host + "/v1/users/" + config.username + "/buckets";
            const res = await request(url, 'POST', data);
            handler(res);
        };

        node.readBucket = function(bucketId, queryParameters){
            // Query parameters to string
            var queryParametersString = "";
            queryParameters.forEach(function(value,key) {
                if (value) {
                    queryParametersString += key+"="+value+"&";
                }
            });

            const url = (config.ssl ? 'https://' : "http://") + config.host + "/v1/users/" + config.username + "/buckets/" + bucketId + "/data?" + queryParametersString;
            return request(url, 'GET');
        };

        node.writeBucket = function(bucketId, data){
            const url = (config.ssl ? 'https://' : "http://") + config.host + "/v1/users/" + config.username + "/buckets/" + bucketId + "/data";
            request(url, 'POST', data);
        };

        node.createDevice = async function(data, handler){
            // It fails when no credentials are passed as expected by the backend
            const url = (config.ssl ? 'https://' : "http://") + config.host + "/v1/users/" + config.username + "/devices";
            const res = await request(url, 'POST', data);
            handler(res);
        };

        node.readDevice = async function(deviceId, resourceId, handler){
            const url = (config.ssl ? 'https://' : "http://") + config.host + "/v3/users/" + config.username + "/devices/" + deviceId + "/resources/" + resourceId;
            const res = await request(url, 'GET');
            handler(res);
        };

        node.writeDevice = async function(deviceId, resourceId, data, handler){
            const url = (config.ssl ? 'https://' : "http://") + config.host + "/v3/users/" + config.username + "/devices/" + deviceId + "/resources/" + resourceId;
            const res = await request(url, 'POST', data);
            handler(res);
        };

        node.callbackDevice = async function(device, assetType, assetGroup, prefix, data, handler){
            const url = (config.ssl ? 'https://' : "http://") + config.host + "/v3/users/" + config.username + "/devices/" + device + "/callback";

            // Check if device exists if not autoprovision resources
            const res1 = await request(url, 'GET');
            if ( !res1 ) {
                let json = {};

                // create auto provisioned device
                json.type = "HTTP";
                json.device = prefix+device;
                json.name = device;
                json.description = "Auto provisioned Node-RED Device"
                if (assetType) {
                    json.asset_type = assetType;
                }
                if (assetGroup) {
                    json.asset_group = assetGroup;
                }

                await node.createDevice(json, function(res) {
                    if ( !res ) {
                        return new Error(`Could not create device on device callback auto provisioning`);
                    }
                });

                // create auto provisioned bucket
                json = {};
                json.bucket = prefix+device;
                json.name = device;
                json.description = "Auto provisioned Node-RED Bucket";
                json.enabled = true;
                json.config = {"source": "api"}
                if (assetType) {
                    json.asset_type = assetType;
                }
                if (assetGroup) {
                    json.asset_group = assetGroup;
                }

                await node.createBucket(json, function(res) {
                    if ( !res ) {
                        return new Error(`Could not create bucket on device callback auto provisioning`);
                    }
                });

                // set write bucket action
                const dataAction = { 
                    "actions": {
                        "write_bucket": device
                    }
                }
                await request(url, 'PUT', dataAction); // There is no response
            }

            const res = await request(url+"/data", 'POST', data);
            handler(res);
        };

        node.readProperty = async function(assetType, assetId, propertyId, handler){
            const apiVersion = (assetType == "devices" ? "v3" : "v1");
            const url = (config.ssl ? 'https://' : "http://") + config.host + "/" + apiVersion + "/users/" + config.username + "/" + assetType + "/" + assetId + "/properties/" + propertyId;
            const res = await request(url, 'GET');
            handler(res);
        };

        node.writeProperty = async function(assetType, assetId, propertyId, data, handler){
            const apiVersion = (assetType == "devices" ? "v3" : "v1");
            const url = (config.ssl ? 'https://' : "http://") + config.host + "/" + apiVersion + "/users/" + config.username + "/" + assetType + "/" + assetId + "/properties/" + propertyId;

            // Check if property exists if not create it
            const res = await request(url, 'GET');
            if ( !res ) {
                const res1 = await request(
                    url.replace("/"+propertyId,""),
                    'POST',
                    JSON.parse('{"property":"'+propertyId+'","value":'+data+'}'));
                handler(res1);
            } else {
                const res1 = await request(url, 'PUT', JSON.parse('{"property":"'+propertyId+'","value":'+data+'}'));
                handler(res1);
            }
        };

        node.unRegisterDeviceResourceListener = function (deviceId, resourceId, node){
            // check the device exists
            let device = devices[deviceId];
            if(!device) return;

            // check the resource exists
            let resource = device.resources[resourceId];
            if(!resource) return;

            // check that the listener is on
            if(resource.listeners[node.id]){
                delete resource.listeners[node.id];
                node.log("Listener Cleared");

                controlDeviceResourceStreaming(device, resource);

                // no more listeners in the resource
                if(!Object.keys(resource.listeners).length){
                    delete device.resources[resourceId];
                    node.log("Resource Cleared");

                    // device has no any resource
                    if(!Object.keys(device.resources).length){
                        // close websocket
                        if(device.wss){
                            node.log("Websocket Closed");
                            device.wss.close();
                        }
                        // delete device
                        delete devices[deviceId];
                        node.log("Device Cleared");

                    }
                }
            }
        };

        node.registerDeviceResourceListener = function(deviceId, resourceId, interval, node) {
            // initialize the device if it does not exists
            let device = devices[deviceId];
            if(device === undefined){
                device = devices[deviceId] = {
                    id : deviceId,
                    resources: {}
                };
            }

            // initialize device resource
            let resource = device.resources[resourceId];
            if(resource === undefined){
                resource = device.resources[resourceId] = {
                    id: resourceId,
                    interval: undefined,
                    listeners : {}
                };
            }

            // add listener
            resource.listeners[node.id] = {
                interval : interval,
                node: node
            };

            // control the device streaming
            controlDeviceResourceStreaming(device, resource);
        };

        timeout = setTimeout(function tick() {
            handleReconnection();
            timeout = setTimeout(tick, RECONNECT_TIMEOUT_MS);
        }, RECONNECT_TIMEOUT_MS);
    }

    function controlDeviceResourceStreaming(device, resource){
        // there are listeners (or nodes) waiting for information
        if(Object.keys(resource.listeners).length){
            // get current resource interval
            let currentInterval = resource.interval;

            // set resource interval to the greatest common divisor of all listeners
            resource.interval = getDeviceResourceInterval(device, resource);

            // update skip values for listeners
            for(let id in resource.listeners){
                let listener = resource.listeners[id];
                if(listener.interval!==resource.interval){
                    listener.skipMeasures = listener.interval>0? listener.interval  / resource.interval : 0;
                    listener.skipCurrent  = listener.interval>0? listener.interval  / resource.interval : 0;
                }
            }

            // initialize websocket in new connection
            if(!device.wss || device.wss.readyState === device.wss.CLOSING || device.wss.readyState === device.wss.CLOSED) {
                device.wss = getDeviceWebsocket(device.id);
                // create/update stream subscription
            }else if(currentInterval!==resource.interval){
                controlDeviceResource(device.id, {
                    resource: resource.id,
                    interval: Number(resource.interval),
                    enabled: true
                });
            }
        }else{
            controlDeviceResource(device.id, {
                resource: resource.id,
                enabled: false
            });
        }
    }

    function gcd(arr){
        let i, y,
            n = arr.length,
            x = Math.abs(arr[0]);

        for (i = 1; i < n; i++) {
            y = Math.abs(arr[i]);
            while (x && y) {
                (x > y) ? x %= y : y %= x;
            }
            x += y;
        }
        return x;
    }

    function getDeviceResourceInterval(device, resource){
        let intervals = [];
        for(let id in resource.listeners){
            let listener = resource.listeners[id];
            intervals.push(listener.interval);
        }
        let result =  intervals.length!==0 ? gcd(intervals) : 0;
        node.log("Computing intervals for " + device.id + "[" + resource.id + "] with: " + JSON.stringify(intervals) + " -> " + result);
        return result;
    }

    function controlDeviceResource(deviceId, control){
        let device = devices[deviceId];
        if(device === undefined) return;
        node.log(">> Sending to " + deviceId + ": " + JSON.stringify(control));
        device.wss.send(JSON.stringify(control));
    }

    function getDeviceWebsocket(deviceId){
        const url = (config.ssl ? 'wss://' : "ws://") + config.host + "/v3/users/" + config.username + "/devices/" + deviceId + "/resources?authorization=" + token;

        node.log("opening websocket to " + url);

        let wss = new WebSocket(url);

        wss.on('error', function(e){
            console.error("websocket failed");
            console.error(e);

            // get current device
            let device = devices[deviceId];
            if(device === undefined) return;

            for(let resource_name in device.resources){
                // mark listeners as connected
                let resource = device.resources[resource_name];
                for(let id in resource.listeners) {
                    let listener = resource.listeners[id];
                    listener.node.status({fill:"red", shape:"ring", text: 'disconnected'});
                }
            }

            wss.close();
        });

        wss.on('open', function open() {
            // get current device
            let device = devices[deviceId];
            if(device === undefined) return;

            for(let resource_name in device.resources){
                // mark listeners as connected
                let resource = device.resources[resource_name];
                for(let id in resource.listeners) {
                    let listener = resource.listeners[id];
                    listener.node.status({fill:"green",shape:"dot",text:"connected"});
                }
                // control resource
                controlDeviceResource(deviceId, {
                    resource: resource_name,
                    interval: Number(resource.interval),
                    enabled: true
                });
            }
        });

        wss.on('message', function incoming(data) {
            //node.log("<< Received from " + deviceId + ": " + data);

            // get current device
            let device = devices[deviceId];
            if(device === undefined) return;

            // parse incoming data
            let payload = JSON.parse(data);

            // get resource
            let resource = device.resources[payload.resource];

            // no listeners for this resource?
            if(resource === undefined) return;

            for(let id in resource.listeners) {
                let listener = resource.listeners[id];
                if(listener.skipMeasures){
                    node.log("Listener " + id + ": SkipMeasures(" + listener.skipMeasures + ") SkipCurrent (" + listener.skipCurrent + ")");
                    if(listener.skipCurrent===listener.skipMeasures){
                        listener.skipCurrent = 1;
                    }else{
                        listener.skipCurrent++;
                        continue;
                    }
                }
                listener.node.status({fill:"blue",shape:"dot",text:"connected"});
                listener.node.send({payload: payload.out ? payload.out : payload.in});
                listener.node.status({fill:"green",shape:"dot",text:"connected"});
            }
        });

        wss.on('close', function close() {
            // get current device
            let device = devices[deviceId];
            if(device === undefined) return;
            for(let resource_name in device.resources){
                // mark listeners as connected
                let resource = device.resources[resource_name];
                for(let id in resource.listeners) {
                    let listener = resource.listeners[id];
                    listener.node.status({fill:"red",shape:"ring",text:"disconnected"});
                }
            }
        });

        return wss;
    }

    RED.nodes.registerType("thinger-server", ThingerServerNode, {
        credentials: {
            token: {type: "text"}
        }
    });

    /**
    *  Admin Endpoints
    */
    RED.httpAdmin.get("/assets/:asset", RED.auth.needsPermission('assets.read'), async function(req,res) {
        var filter = "";
        if (req.query.name) {
            filter = "name="+req.query.name;
        }

        try {
            const url = (config.ssl ? 'https://' : "http://") + config.host + "/v1/users/" + config.username + "/" + req.params.asset + "?" + filter;
            res.json(await request(url, 'GET'));
        } catch(err) {
            res.sendStatus(500);
            node.error(RED._("assets.failed",{error:err.toString()}));
        }
    });

    RED.httpAdmin.get("/assets/:asset/:asset_id/:properties", RED.auth.needsPermission('properties.read'), async function(req,res) {
        const apiVersion = (req.params.asset == "devices" ? "v3" : "v1");

        var filter = "";
        if (req.query.name) {
            filter = "name="+req.query.name;
        }

        try {
            const url = (config.ssl ? 'https://' : "http://") + config.host + "/" + apiVersion + "/users/" + config.username + "/" + req.params.asset + "/" + req.params.asset_id + "/" + req.params.properties + "?" + filter;
            res.json(await request(url, 'GET'));
        } catch(err) {
            res.sendStatus(500);
            node.error(RED._("properties.failed",{error:err.toString()}));
        }
    });

    RED.httpAdmin.get("/assets/:asset/:asset_id/:properties/:property_id", RED.auth.needsPermission('properties.write'), async function(req,res) {
        const apiVersion = (req.params.asset == "devices" ? "v3" : "v1");

        var filter = "";
        if (req.query.name) {
            filter = "name="+req.query.name;
        }

        try {
            const url = (config.ssl ? 'https://' : "http://") + config.host + "/" + apiVersion + "/users/" + config.username + "/" + req.params.asset + "/" + req.params.asset_id + "/" + req.params.properties + req.params.property_id + "?" + filter;
            res.json(await request(url, 'GET'));
        } catch(err) {
            res.sendStatus(500);
            node.error(RED._("properties.failed",{error:err.toString()}));
        }
    });

    RED.httpAdmin.get('/thinger-server/js/*', function(req, res){
        var options = {
            root: __dirname + '/static/',
            dotfiles: 'deny'
        };

        res.sendFile(req.params[0], options);
    });

};
