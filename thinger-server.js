const WebSocket = require('ws');
const request = require('request');
const jwt = require('jsonwebtoken');


module.exports = function(RED) {

    const RECONNECT_TIMEOUT_MS = 10000;
    var devices = {};
    var config = undefined;
    var timeout = undefined;

    function handleReconnection(){
        for(var id in devices){
            var device = devices[id];
            if(device.wss && (device.wss.readyState === device.wss.CLOSED)){
                device.wss = getDeviceWebsocket(id);
            }
        }
    }

    function closeWebsockets(){
        for(var id in devices){
            var device = devices[id];
            if(device.wss){
                device.wss.close();
            }
        }
    }

    function ThingerServerNode(configa) {
        RED.nodes.createNode(this, configa);
        var node = this;
        config = configa;

        // get the decoded payload and header
        var decoded = jwt.decode(config.token, {complete: true});
        if(decoded && decoded.payload.usr){
            config.username = decoded.payload.usr;
        }else{
            node.error("Invalid JWT Token");
            return;
        }

        node.on('close', function(removed, done) {
            // clear reconnection timeout
            clearTimeout(timeout);

            // close device connections
            closeWebsockets();

            done();
        });

        node.callEndpoint = function(endpointId, data){
            const url = (config.ssl ? 'https://' : "http://") + config.host + "/v1/users/" + config.username + "/endpoints/" + endpointId + "/call?authorization=" + config.token;
            request({
                url: url,
                method: "POST",
                json: true,
                body: data
            }, function (error, response, body){
                console.log(response);
            });
        };

        node.writeBucket = function(bucketId, data){
            const url = (config.ssl ? 'https://' : "http://") + config.host + "/v1/users/" + config.username + "/buckets/" + bucketId + "/data?authorization=" + config.token;
            request({
                url: url,
                method: "POST",
                json: true,
                body: data
            }, function (error, response, body){
                console.log(response);
            });
        };

        node.readDevice = function(deviceId, resourceId, handler){
            const url = (config.ssl ? 'https://' : "http://") + config.host + "/v2/users/" + config.username + "/devices/" + deviceId + "/" + resourceId + "?authorization=" + config.token;
            console.log(url);
            request({
                url: url,
                method: "GET",
                json: true
            }, handler);
        };

        node.writeDevice = function(deviceId, resourceId, data){
            const url = (config.ssl ? 'https://' : "http://") + config.host + "/v2/users/" + config.username + "/devices/" + deviceId + "/" + resourceId + "?authorization=" + config.token;
            request({
                url: url,
                method: "POST",
                json: true,
                body: {in : data}
            }, function (error, response, body){
                console.log(response);
            });
        };

        node.unRegisterDeviceResourceListener = function (deviceId, resourceId, node){
            // check the device exists
            var device = devices[deviceId];
            if(!device) return;

            // check the resource exists
            var resource = device.resources[resourceId];
            if(!resource) return;

            // check that the listener is on
            if(resource.listeners[node.id]){
                delete resource.listeners[node.id];
                console.log("Listener Cleared");

                controlDeviceResourceStreaming(device, resource);

                // no more listeners in the resource
                if(!Object.keys(resource.listeners).length){
                    delete device.resources[resourceId];
                    console.log("Resource Cleared");

                    // device has no any resource
                    if(!Object.keys(device.resources).length){
                        // close websocket
                        if(device.wss){
                            console.log("Websocket Closed");
                            device.wss.close();
                        }
                        // delete device
                        delete devices[deviceId];
                        console.log("Device Cleared");

                    }
                }
            }
        };

        node.registerDeviceResourceListener = function(deviceId, resourceId, interval, node) {
            // initialize the device if it does not exists
            var device = devices[deviceId];
            if(device === undefined){
                device = devices[deviceId] = {
                    id : deviceId,
                    resources: {}
                };
            }

            // initialize device resource
            var resource = device.resources[resourceId];
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
            var currentInterval = resource.interval;

            // set resource interval to the greatest common divisor of all listeners
            resource.interval = getDeviceResourceInterval(device, resource);

            // update skip values for listeners
            for(var id in resource.listeners){
                var listener = resource.listeners[id];
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
        var i, y,
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
        var intervals = [];
        for(var id in resource.listeners){
            var listener = resource.listeners[id];
            intervals.push(listener.interval);
        }
        var result =  intervals.length!==0 ? gcd(intervals) : 0;
        console.log("Computing intervals for " + device.id + "[" + resource.id + "] with: " + JSON.stringify(intervals) + " -> " + result);
        return result;
    }

    function controlDeviceResource(deviceId, control){
        var device = devices[deviceId];
        if(device === undefined) return;
        console.log(">> Sending to " + deviceId + ": " + JSON.stringify(control));
        device.wss.send(JSON.stringify(control));
    }

    function getDeviceWebsocket(deviceId){
        const url = (config.ssl ? 'wss://' : "ws://") + config.host + "/v2/users/" + config.username + "/devices/" + deviceId + "?authorization=" + config.token;

        console.log("opening websocket to " + url);

        var wss = new WebSocket(url);

        wss.on('error', function(e){
            // get current device
            var device = devices[deviceId];
            if(device === undefined) return;

            for(var resource_name in device.resources){
                // mark listeners as connected
                var resource = device.resources[resource_name];
                for(var id in resource.listeners) {
                    var listener = resource.listeners[id];
                    listener.node.error("Cannot connect to Device", e.toString());
                    listener.node.status({fill:"red", shape:"ring", text: 'disconnected'});
                }
            }

            wss.close();
        });

        wss.on('open', function open() {
            // get current device
            var device = devices[deviceId];
            if(device === undefined) return;

            for(var resource_name in device.resources){
                // mark listeners as connected
                var resource = device.resources[resource_name];
                for(var id in resource.listeners) {
                    var listener = resource.listeners[id];
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
            //console.log("<< Received from " + deviceId + ": " + data);

            // get current device
            var device = devices[deviceId];
            if(device === undefined) return;

            // parse incoming data
            var payload = JSON.parse(data);

            // get resource
            var resource = device.resources[payload.resource];

            // no listeners for this resource?
            if(resource === undefined) return;

            for(var id in resource.listeners) {
                var listener = resource.listeners[id];
                if(listener.skipMeasures){
                    console.log("Listener " + id + ": SkipMeasures(" + listener.skipMeasures + ") SkipCurrent (" + listener.skipCurrent + ")");
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
            var device = devices[deviceId];
            if(device === undefined) return;
            for(var resource_name in device.resources){
                // mark listeners as connected
                var resource = device.resources[resource_name];
                for(var id in resource.listeners) {
                    var listener = resource.listeners[id];
                    listener.node.status({fill:"red",shape:"ring",text:"disconnected"});
                }
            }
        });

        return wss;
    }

    RED.nodes.registerType("thinger-server", ThingerServerNode);

};