module.exports = function (RED) {
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
    let asset = config.asset;
    let event = config.event;
    let filter = "";
    switch (true) {
      case /^bucket.*/.test(event):
        filter = config.bucket;
        break;
      case /^device.*/.test(event):
        filter = config.device;
        break;
      case /^endpoi.*/.test(event):
        filter = config.endpoint;
        break;
    }
    if (config.filter !== undefined && config.filter !== "")
      filter = config.filter; // if field filter exists its value will be predominant
    let filters = config.filters;

    // backwards compatibility
    let state = config.state;
    if (config.state !== undefined && state !== "") {
      if (filters === undefined) filters = {};
      filters["state"] = state;
    }

    let subscription = {};
    if (filter !== "" && asset !== undefined && asset !== "")
      subscription[asset] = filter;
    else if (filter !== "") subscription[event.split("_")[0]] = filter;
    if (event !== "any" && event !== "") subscription["event"] = event;
    else subscription["event"] = `${asset !== "" ? asset + "_.*" : ".*"}`;
    for (let key in filters) {
      if (filters[key] !== "any" && filters[key] !== "")
        subscription[key] = filters[key];
    }

    function on_open() {
      node.status({ fill: "green", shape: "dot", text: "connected" });
      node.log("sending event subscription: " + JSON.stringify(subscription));
      wss.send(JSON.stringify(subscription));
    }

    function on_message(payload) {
      node.status({ fill: "blue", shape: "dot", text: "connected" });
      node.send({ payload: payload });
      node.status({ fill: "green", shape: "dot", text: "connected" });
    }

    function reconnect() {
      node.status({ fill: "red", shape: "dot", text: "websocket error" });
      if (closing || timeout) return;
      timeout = setTimeout(function () {
        node.log("trying to reconnect");
        timeout = undefined;
        if (typeof server.openWebsocket === "function")
          wss = server.openWebsocket(
            node,
            "/events",
            on_open,
            on_message,
            reconnect,
            reconnect
          );
        else node.error("server-events: check thinger server configuration");
      }, RECONNECT_TIMEOUT_MS);
    }

    // initialize websocket connection
    if (typeof server.openWebsocket === "function")
      wss = server.openWebsocket(
        node,
        "/events",
        on_open,
        on_message,
        reconnect,
        reconnect
      );
    else node.error("server-events: check thinger server configuration");

    // unregister listener on close
    this.on("close", function () {
      node.status({ fill: "red", shape: "dot", text: "disconnected" });
      closing = true;
      clearTimeout(timeout);
      node.log("closing websocket connection");
      if (wss) wss.close(1000);
    });
  }

  RED.nodes.registerType("server-events", ServerEventsNode);
};
