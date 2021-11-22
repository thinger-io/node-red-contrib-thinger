module.exports = function(RED) {
    'use strict';
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
        let asset = config.asset;
        let event = config.event;
        let filter = config.filter;
        let filters = config.filters;

        let subscription = {};
        if (filter !== "")
            subscription[asset] = filter;
        if (event !== "any" && event !== "")
            subscription["event"] = event;
        else subscription["event"] = `${asset !== "" ? asset+"_.*" : ".*"}`;
        for (let key in filters) {
          if (filters[key] !== "any" && filters[key] !== "")
              subscription[key] = filters[key];
        }

        function on_open(){
            node.log("sending event subscription: " + JSON.stringify(subscription));
            wss.send(JSON.stringify(subscription));
        }

        function on_message(payload){
            node.send({payload: payload});
        }

        function reconnect(){
            if(closing || timeout) return;
            timeout = setTimeout(function() {
                node.log("trying to reconnect");
                timeout=undefined;
                wss = server.openWebsocket(node, "/events", on_open, on_message, reconnect, reconnect);
            }, RECONNECT_TIMEOUT_MS);
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
