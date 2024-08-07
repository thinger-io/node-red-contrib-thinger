const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const Utils = require('../lib/utils/utils.js');
const Request = require('../lib/utils/request.js');

const RECONNECT_TIMEOUT_MS = 10000;

module.exports = function(RED) {

    "use strict";

    function ThingerServerNode(configa) {
        let devices = {};
        let config = undefined;
        let token = undefined; // TODO: remove token from config, should only be accesible via credentials
        let timeout = undefined;
        let node = this;

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

        RED.nodes.createNode(this, configa);

        node = this;
        config = configa;
        node.config = config; // export to use in exposed APIs

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

        let maxSockets = config.maxSockets;
        let requestTimeout = config.requestTimeout;
        const ThingerRequest = new Request(token, maxSockets, requestTimeout);

        // As precaution, but should not be the desired handler: will handle all rejections from requests
        //process.on('unhandledRejection', e => {
            //this.error("Unhandled Rejection");
        //    node.error(e);
        //});

        node.on('close', function(_removed, done) {
            // clear reconnection timeout
            clearTimeout(timeout);

            // close device connections
            closeWebsockets();

            done();
        });

        node.openWebsocket = function(caller, path, on_open, on_message, on_close, on_error){
            const url = `${config.ssl ? "wss://" : "ws://"}${config.host}/v1/users/${config.username}${path}?authorization=${config.token}`;
            caller.log(`opening websocket to: ${url}`);
            let wss = new WebSocket(url);

            wss.on('error', function(e){
                caller.error(e && e.message ? e.message : "websocket error");
                if(on_error) on_error(e);
            });

            wss.on('open', function open() {
                if(on_open) on_open();
            });

            wss.on('message', function incoming(data) {
                // parse incoming data
                let payload = JSON.parse(data);
                if(on_message) on_message(payload);
            });

            wss.on('close', function close() {
                if(on_close) on_close();
            });

            return wss;
        };

        // function used by all nodes
        node.request = function(caller, url, method, data, external = false) {
            if (typeof caller === 'undefined') caller = node;
            return ThingerRequest.request(url, method, data, external)
              .then(res => {
                  let body = data;
                  if (typeof data !== 'undefined') {
                      if (Buffer.isBuffer(data))
                          body = data.toString('hex');
                      else if (typeof data === 'object')
                          body = JSON.stringify(data);
                  } else body = '';
                  caller.log(`${res.status} ${method} ${url} ${Utils.truncateString(body, 1024)}`);
                  return res;
              })
              .catch(err => {
                  let body = data;
                  if (typeof data !== 'undefined') {
                      if (Buffer.isBuffer(data))
                          body = data.toString('hex');
                      else if (typeof data === 'object')
                          body = JSON.stringify(data);
                  } else body = '';
                  caller.log(`${err.status} ${method} ${url} ${Utils.truncateString(body, 1024)}`);
                  throw err; // handle from parent caller
              });
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

        function getDeviceResourceInterval(device, resource){
            let intervals = [];
            for(let id in resource.listeners){
                let listener = resource.listeners[id];
                intervals.push(listener.interval);
            }
            let result =  intervals.length!==0 ? Utils.gcd(intervals) : 0;
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
            const url = `${config.ssl ? "wss://" : "ws://"}${config.host}/v3/users/${config.username}/devices/${deviceId}/resources?authorization=${token}`;

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
                try {

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
                    listener.node.send({payload: payload});
                    listener.node.status({fill:"green",shape:"dot",text:"connected"});
                  }

                } catch (e) {

                  node.error(e.message);
                  console.debug(e.stack);

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

    }

    RED.nodes.registerType("thinger-server", ThingerServerNode, {
        credentials: {
            token: {type: "text"}
        }
    });

    // API Endpoints
    RED.httpNode.get("/assets/:asset", async function(req,res) {

        const node = RED.nodes.getNode(req.query.node_id);

        if (!req.query.svr_id) { // If no server node has been selected return empty
            node.error(`assets.failed: missing thinger server`);
            return res.json({});
        }

        // User is adding new server option
        if (req.query.svr_id === "_ADD_") return res.json({});

        const server = RED.nodes.getNode(req.query.svr_id);
        if ( !server ) return res.json({});

        let filter = "";
        if (req.query.name) {
            filter = `name=${req.query.name}`;
        }
        // Get the project from the flow or group
        if ( req.query.project ) {
            filter = `project=${req.query.project}&${filter}`;
        }

        try {
            const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v1/users/${server.config.username}/${req.params.asset}?${filter}`;
            res.json((await server.request(server, url, 'GET')).payload);
        } catch(err) {
            res.sendStatus(500);
            if ( server )
                server.error(`assets.failed ${err.toString()}`);
        }
    });

    RED.httpNode.get("/assets/:category/:asset", async function(req,res) {

        const node = RED.nodes.getNode(req.query.node_id);

        if (!req.query.svr_id) { // If no server node has been selected return empty
            node.error(`assets.failed: missing thinger server`);
            return res.json({});
        }

        // User is adding new server option
        if (req.query.svr_id === "_ADD_") return res.json({});

        const server = RED.nodes.getNode(req.query.svr_id);
        if ( !server ) return res.json({});

        let filter = "";
        if (req.query.name) {
            filter = `name=${req.query.name}`;
        }
        // Get the project from the flow or group
        if ( req.query.project ) {
            filter = `project=${req.query.project}&${filter}`;
        }

        try {
            const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v1/users/${server.config.username}/${req.params.category}/${req.params.asset}?${filter}}`;
            res.json((await server.request(server, url, 'GET')).payload);
        } catch(err) {
            res.sendStatus(500);
            server.error(`assets.failed ${err.toString()}`);
        }
    });

    RED.httpNode.get("/assets/:asset/:asset_id/:properties", async function(req,res) {

        const apiVersion = (req.params.asset === "devices" ? "v3" : "v1");

        const node = RED.nodes.getNode(req.query.node_id);

        if (!req.query.svr_id) { // If no server node has been selected return empty
            node.error(`properties.failed: missing thinger server`);
            return res.json({});
        }

        // User is adding new server option
        if (req.query.svr_id === "_ADD_") return res.json({});

        const server = RED.nodes.getNode(req.query.svr_id);
        if ( !server ) return res.json({});

        let filter = "";
        if (req.query.name) {
            filter = "name="+req.query.name;
        }
        // Get the project from the flow or group
        if ( req.query.project ) {
            filter = `project=${req.query.project}&${filter}`;
        }

        try {
            const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/${apiVersion}/users/${server.config.username}/${req.params.asset}/${req.params.asset_id}/${req.params.properties}?${filter}`;
            res.json((await server.request(server,url, 'GET')).payload);
        } catch(err) {
            res.sendStatus(500);
            server.error(`properties.failed ${err.toString()}`);
        }
    });

    RED.httpNode.get("/assets/:asset/:asset_id/:properties/:property_id", async function(req,res) {

        const apiVersion = (req.params.asset === "devices" ? "v3" : "v1");

        const node = RED.nodes.getNode(req.query.node_id);

        if (!req.query.svr_id) { // If no server node has been selected return empty
            node.error(`properties.failed: missing thinger server`);
            return res.json({});
        }

        // User is adding new server option
        if (req.query.svr_id === "_ADD_") return res.json({});

        const server = RED.nodes.getNode(req.query.svr_id);
        if ( !server ) return res.json({});

        let filter = "";
        if (req.query.name) {
            filter = "name="+req.query.name;
        }
        // Get the project from the flow or group
        if ( req.query.project ) {
            filter = `project=${req.query.project}&${filter}`;
        }


        try {
            const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/${apiVersion}/users/${server.config.username}/${req.params.asset}/${req.params.asset_id}/${req.params.properties}/${req.params.property_id}?${filter}`;
            res.json((await server.request(server, url, 'GET')).payload);
        } catch(err) {
            res.sendStatus(500);
            server.error(`properties.failed ${err.toString()}`);
        }
    });

    RED.httpNode.get("/users/user", async function(req,res) {

        if (typeof req.query.svr_id === 'undefined' || !req.query.svr_id || req.query.svr_id === "") { // If no server node has been selected return empty
            console.error(`users.failed: missing thinger server`);
            return res.json({});
        }

        // User is adding new server option
        if (req.query.svr_id === "_ADD_") return res.json({});

        const server = RED.nodes.getNode(req.query.svr_id);
        if ( !server ) return res.json({});

        // if server is null
        if ( !server ) {
            console.error(`users.failed: server not found`);
            return res.json({});
        }

        try {
            const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v1/users/${server.config.username}`;
            res.json((await server.request(server, url, 'GET')).payload);
        } catch(err) {
            res.sendStatus(500);
            server.error(`users.failed ${err.toString()}`);
        }
    });

    RED.httpNode.get("/server/:resource", async function(req,res) {

        let host = "";
        let ssl = true;
        let server = undefined;

        if (typeof req.query.svr_id !== "undefined" && req.query.svr_id) {
            // User is adding new server option
            if (req.query.svr_id === "_ADD_") return res.json({});

            server = RED.nodes.getNode(req.query.svr_id);
        }

        if (typeof server === "undefined" || !server) {
            host = 'backend.thinger.io'
        } else {
            host = server.config.host;
            ssl = server.config.ssl;
        }

        try {
            const method = 'GET';
            const url = `${ssl ? "https://" : "http://"}${host}/v1/server/${req.params.resource}`;
            let data = {};
            if (typeof server !== 'undefined' && server !== null && !server) {
                data = (await server.request(server, url, method)).payload;
            }
            else {
                let ThingerRequest = new Request();
                data = (await  ThingerRequest.request(url, method)).payload;
            }
            // order assets
            if (req.params.resource === "assets") {
                data = Utils.sortObjectArray(data,"asset");
            }
            res.json(data);
        } catch(err) {
            res.sendStatus(500);
            server.error(`server.failed ${err.toString()}`);
        }
    });

    RED.httpAdmin.get('/thinger/static/*', function(req, res){
        const options = {
            root: __dirname + '/../static/',
            dotfiles: 'deny'
        };

        res.sendFile(req.params[0], options);
    });

};
