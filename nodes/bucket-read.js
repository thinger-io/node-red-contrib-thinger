module.exports = function(RED) {

    "use strict";

    /**
     * Will return the date of the timestamp based on prior value and units
     */
    function priorDate(ts, units, value) {
        let priorTs = new Date();
        switch (units) {
            case 's':
                priorTs = new Date(ts.setSeconds(ts.getSeconds() - value));
                break;
            case 'm':
                priorTs = new Date(ts.setMinutes(ts.getMinutes() - value));
                break;
            case 'h':
                priorTs = new Date(ts.setHours(ts.getHours() - value));
                break;
            case 'd':
                priorTs = new Date(ts.setDate(ts.getDate() - value));
                break;
            case 'w':
                priorTs = new Date(ts.setDate(ts.getDate() - value*7));
                break;
            case 'y':
                priorTs = new Date(ts.setFullYear(ts.getFullYear() - value));
                break;
        }
        return priorTs;
    }

    /**
     * Axuliary function that calls the server function read bucket with a maximum items parameter
     * of 1000, until there are no more items to retrieve.
     * From the promise returned by the server function it will call itself recursively until done,
     * before returning a promise.
     *
     * NOTE: last N items will not have syncronization problems if it goes above 1000 items, as the
     * request will need to be executed more than once and the bucket could be written in the meantime.
     * After the first query, which will be done by descending order the next items will be retrieved
     * from the last timestamp. It it needs to be sorted by ascending it will be outside this function.
     */
    function readBucket(server, node, bucket, queryParameters, limit, result) {

        // Maximum value of items on the query parameter is 1000
        queryParameters.set('items',limit > 1000 || limit < 0 ? 1000 : limit);

        // Query parameters to string
        let queryParametersString = "";
        queryParameters.forEach(function(value,key) {
            if (value) {
                queryParametersString += key+"="+value+"&";
            }
        });

        const method = 'GET';
        const url = `${server.config.ssl ? "https://" : "http://"}${server.config.host}/v1/users/${server.config.username}/buckets/${bucket}/data?${queryParametersString}`;

        // Recursive call to readBucket until done
        if (typeof server.request === "function")
            return server.request(node, url, method)
            .then(function(res) {

                // Throw if response fails
                if (!res.status.toString().startsWith('20'))
                    throw res.error;

                if (!result) {
                    result = [];
                }

                result = result.concat(res.payload);

                limit = (res.payload.length > 0 ? limit - res.payload.length : 0);

                if (limit != 0 && res.payload.length == 1000) { // There is more
                    switch (queryParameters.get("sort")) {
                        case "asc":
                            queryParameters.set("min_ts",res.payload[999].ts-1);
                            break;
                        case "desc":
                            queryParameters.set("max_ts",res.payload[999].ts-1);
                            break;
                     }

                     return readBucket(server, node, bucket, queryParameters, limit, result);
                 }
                 return result;

              })
              //.catch(e => node.error(e));
          else
              throw new Error("Check Thinger Server Configuration");
     }

    function BucketReadNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call bucket read on close
        node.on("input",function(msg, send, done) {

            let bucket = config.bucket || msg.bucket;

            const queryParameters = new Map();
            queryParameters.set('items',config.items || msg.items);
            queryParameters.set('agg',config.aggregation || msg.aggregation);
            queryParameters.set('agg_type',config.aggregationType || msg.aggregation_type);
            queryParameters.set('sort',config.sort || msg.sort);

            // Timeframe filters
            let filter = config.filter || msg.filter;
            var isFilterTime = true;
            var isSimpleSorting = false;
            var maxTs;
            var minTs;

            switch(filter) {
                case "relative":
                    let timeframeSeq = config.timespanSequence || msg.timespan_sequence;
                    let timeframeValue = config.timespanValue || msg.timespan_value;
                    let timeframeUnits = config.timespanUnits || msg.timespan_units;

                    minTs = new Date();
                    maxTs = minTs.getTime();

                    minTs = priorDate(minTs, timeframeUnits, timeframeValue);

                    // If sequence is previous minTs will need to pass again through the filter and maxTs will be previous minTs
                    if (timeframeSeq == "previous") {
                        maxTs = minTs.getTime();
                        minTs = priorDate(minTs, timeframeUnits, timeframeValue);
                    }

                    minTs = minTs.getTime();

                    break;
                case "absolute":
                    maxTs = new Date(config.maxTs || msg.max_ts).getTime();
                    minTs = new Date(config.minTs || msg.min_ts).getTime();
                    break;
                case "simple":
                    //if selection of last N items, the query will be done as desc and sorted to asc after, otherwise, result would not be last
                    if (queryParameters.get('sort') == "asc") {
                        queryParameters.set('sort','desc');
                        isSimpleSorting = true;
                    }
                    isFilterTime = false;
                    break;
            }

            if (isFilterTime) {
                // Add it to the query parameters
                queryParameters.set('max_ts', maxTs);
                queryParameters.set('min_ts', minTs);
                queryParameters.set('items',config.limit || msg.limit);
            }

            // limit < 0 will indicate all items matching the filter
            var limit = queryParameters.get('items');
            if (!limit) {
                limit = -1;
            }
            var result = [];

            readBucket(server, node, bucket, queryParameters, limit, result)
              .then(function(data) {
                if (isSimpleSorting) { // sort last N items asc if needed
                    data = data.sort(function(a,b) {
                        return a.ts - b.ts;
                    });
                }
                msg.payload = data;
                send(msg);
                done();
              })
              .catch(e => {
                delete e.stack;
                msg.payload = Object.fromEntries(queryParameters);
                msg.payload.bucket = bucket;
                done(e)}
              );

          });
    }

    RED.nodes.registerType("bucket-read", BucketReadNode);
};
