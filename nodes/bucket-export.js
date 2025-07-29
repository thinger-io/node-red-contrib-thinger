module.exports = function (RED) {
  "use strict";

  const Utils = require("../lib/utils/utils");

  let wss = undefined;

  /**
   * Will return the date of the timestamp based on prior value and units
   */
  function priorDate(ts, units, value) {
    let priorTs = new Date();
    switch (units) {
      case "s":
        priorTs = new Date(ts.setSeconds(ts.getSeconds() - value));
        break;
      case "m":
        priorTs = new Date(ts.setMinutes(ts.getMinutes() - value));
        break;
      case "h":
        priorTs = new Date(ts.setHours(ts.getHours() - value));
        break;
      case "d":
        priorTs = new Date(ts.setDate(ts.getDate() - value));
        break;
      case "w":
        priorTs = new Date(ts.setDate(ts.getDate() - value * 7));
        break;
      case "mo":
        priorTs = new Date(ts.setDate(ts.getMonth() - value));
        break;
      case "y":
        priorTs = new Date(ts.setFullYear(ts.getFullYear() - value));
        break;
    }
    return priorTs;
  }

  // Returns the absolute url of the file for private and community instances
  function getFileUrl(server, fileUrl) {
    if (fileUrl.startsWith("file://")) {
      let absoluteUrl = fileUrl.replace("file://", "");
      let urlPieces = absoluteUrl.split("/");
      urlPieces.splice(urlPieces.length - 1, 0, "exports");
      return `https://${server.config.host}/v1/${urlPieces.join("/")}`;
    }
    return fileUrl;
  }

  function subscribeAndExecute(
    server,
    node,
    msg,
    send,
    done,
    bucket,
    body,
    dataReturn
  ) {
    let export_file = "";
    let wsError = false;

    let subscription = {
      event: "bucket_export_completed",
      bucket: bucket,
    };

    function on_open() {
      node.status({ fill: "blue", shape: "ring", text: "waiting for export" });
      node.log("sending event subscription: " + JSON.stringify(subscription));
      wss.send(JSON.stringify(subscription));

      // once the ws is open, execute the export bucket request
      exportBucket(server, node, bucket, body)
        .then(function (data) {
          export_file = data.payload.file;
        })
        .catch(function (e) {
          wss.close(1000);
          delete e.stack;
          msg.payload = {};
          msg.payload.bucket = bucket;
          msg.payload.body = body;

          if (e.hasOwnProperty("status")) msg.payload.status = e.status;

          done(e);
        });
    }

    async function on_message(payload) {
      node.status({ fill: "green", shape: "dot", text: "received export" });
      // Return either the absolute url (community or private) or the content of the file
      if (export_file === payload.file) {
        wss.close(1000);
        payload.url = getFileUrl(server, payload.url);
        if (dataReturn === "content") {
          try {
            // Community instances will export to S3
            let external = !payload.url.includes(server.config.host);
            payload.content = (
              await server.request(node, payload.url, "GET", null, external)
            ).payload;
          } catch (e) {
            delete e.stack;
            msg.payload = {};
            msg.payload.bucket = bucket;
            msg.payload.body = body;
            msg.payload.status = e.status;
            msg.payload.url = payload.url;
            done(e);
            return;
          }
        }
        send({ payload: payload });
        done();
      }
    }

    function on_error(err) {
      wsError = true;
      node.error({ fill: "red", shape: "dot", text: "error on export" });
      wss.close(1000);
      done(err);
    }

    function on_close() {
      if (!wsError)
        node.status({ fill: "grey", shape: "dot", text: "finished export" });
    }

    if (typeof server.openWebsocket === "function")
      wss = server.openWebsocket(
        node,
        "/events",
        on_open,
        on_message,
        on_close,
        on_error
      );
    else node.error("server-events: check thinger server configuration");
  }

  /**
   * Auxiliary function that calls the server function export bucket
   */
  function exportBucket(server, node, bucket, body) {
    const method = "POST";
    const url = `${server.config.ssl ? "https://" : "http://"}${
      server.config.host
    }/v1/users/${server.config.username}/buckets/${bucket}/exports`;

    // Recursive call to readBucket until done
    if (typeof server.request === "function")
      return server.request(node, url, method, body).then(function (res) {
        return res;
      });
    //.catch(e => done(e));
    else throw new Error("Check Thinger Server Configuration");
  }

  function BucketExportNode(config) {
    RED.nodes.createNode(this, config);

    // get node
    const node = this;

    // get server configuration
    const server = RED.nodes.getNode(config.server);

    // call bucket read on close
    node.on("input", function (msg, send, done) {
      let bucket = config.bucket || msg.bucket;
      bucket = Utils.mustacheRender(bucket, msg);

      let body = {};

      body["data_type"] = config.dataType || msg.data_type;

      if (config.callback !== "" || msg.callback !== "") {
        let callbackType = config.callback || msg.callback;
        body["callback"] = callbackType;
        body[callbackType] = config.callbackId || msg.callback_id;
      }

      body["timestamp_format"] = config.timestampFormat || msg.timestamp_format;

      // Render all required templates
      body = Utils.mustacheRender(body, msg);

      /* TODO: uncomment when implemented
            let tags = config.tags && Object.keys(config.tags).length !== 0 ? config.tags : msg.tags;
            tags = Utils.mustacheRender(tags, msg);
            */

      let dataReturn = config.data || msg.data || "url";

      // Timeframe filters
      let range = config.range || msg.range;
      let maxTs;
      let minTs;

      switch (range) {
        case "relative":
          let timeframeSeq = config.timespanSequence || msg.timespan_sequence;
          let timeframeValue = config.timespanValue || msg.timespan_value;
          let timeframeUnits = config.timespanUnits || msg.timespan_units;

          minTs = new Date();
          maxTs = minTs.getTime();

          minTs = priorDate(minTs, timeframeUnits, timeframeValue);

          // If sequence is previous minTs will need to pass again through the filter and maxTs will be previous minTs
          if (timeframeSeq === "previous") {
            maxTs = minTs.getTime();
            minTs = priorDate(minTs, timeframeUnits, timeframeValue);
          }

          minTs = minTs.getTime();

          break;
        case "absolute":
          maxTs = new Date(config.maxTs || msg.max_ts).getTime();
          minTs = new Date(config.minTs || msg.min_ts).getTime();
          break;
        case "all":
          //if selection of last N items, the query will be done as desc and sorted to asc after, otherwise, result would not be last
          maxTs = 0;
          minTs = 0;
          break;
      }

      // Add ts to the body
      body["max_ts"] = maxTs;
      body["min_ts"] = minTs;

      // Subscribe to all bucket export events
      try {
        subscribeAndExecute(
          server,
          node,
          msg,
          send,
          done,
          bucket,
          body,
          dataReturn
        );
      } catch (e) {
        delete e.stack;

        msg.payload = {};
        msg.payload.bucket = bucket;
        msg.payload.body = body;

        if (e.hasOwnProperty("status")) msg.payload.status = e.status;

        done(e);
      }
    });

    node.on("close", function () {
      if (wss) wss.close(1000);
    });
  }

  RED.nodes.registerType("bucket-export", BucketExportNode);
};
