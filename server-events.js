module.exports = function(RED) {
    "use strict";
    const RECONNECT_TIMEOUT_MS = 5000;

    function ServerEventsNode(config) {
        RED.nodes.createNode(this, config);

        let node = this;
        let wss = undefined;
        let timeout = undefined;
        let closing = false;

        // get server configuration
        let server = RED.nodes.getNode(config.server);

        // fill event info
        let event_fields = ["event", "device", "state"];
        let event = {};
        for (let key in config) {
            if (event_fields.includes(key)){
                let data = config[key].trim();
                if(data.length!==0) event[key] = data;
            }
        }

        function on_open(){
            node.log("sending event subscription: " + JSON.stringify(event));
            wss.send(JSON.stringify(event));
        }

        function on_message(payload){
            node.send({payload: payload});
        }

        function reconnect(){
            if(!closing){
                timeout = setTimeout(function() {
                    node.log("trying to reconnect");
                    wss = server.openWebsocket(node, "/events", on_open, on_message, reconnect, reconnect);
                }, RECONNECT_TIMEOUT_MS);
            }else{
                node.trace("skipping reconnection, node is closing...");
            }
        }

        // initialize websocket connection
        wss = server.openWebsocket(node, "/events", on_open, on_message, reconnect, reconnect);

        // unregister listener on close
        this.on('close', function() {
            closing = true;
            clearTimeout(timeout);
            node.log("closing websocket connection");
            if(wss) wss.close(1000);
        });
    }

    RED.nodes.registerType("server-events", ServerEventsNode);
};