module.exports = function(RED) {

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
                prioTs = new Date(ts.setFullYear(ts.getFullYear() - value));
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
    function readBucket(server, bucket, queryParameters, limit, result) {

        // Maximum value of items on the query parameter is 1000
        queryParameters.set('items',limit > 1000 || limit < 0 ? 1000 : limit);

        // Recursive call to readBucket until done
        return server.readBucket(bucket, queryParameters)
        .then(function(res) {
            if (!result) {
                result = [];
            }
            result = result.concat(res);

            limit = (res.length > 0 ? limit - res.length : 0);

            if (limit != 0 && res.length == 1000) { // There is more
                switch (queryParameters.get("sort")) {
                    case "asc":
                        queryParameters.set("min_ts",res[999].ts-1);
                        break;
                     case "desc":
                        queryParameters.set("max_ts",res[999].ts-1);
                        break;
                 }

                 return readBucket(server, bucket, queryParameters, limit, result);
             }
             return result;

         })
         .catch(console.log);
     }

    function BucketReadNode(config) {
        RED.nodes.createNode(this, config);

        // get node
        var node = this;

        // get server configuration
        var server = RED.nodes.getNode(config.server);

        // call bucket read on close
        node.on("input",function(msg) {


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
                    //if selection of last N items, the query will be done as desc and sorted to asc after
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

            readBucket(server, bucket, queryParameters, limit, result)
              .then(function(result) {
                if (isSimpleSorting) { // sort last N items asc if needed
                    result = result.sort(function(a,b) {
                        return a.ts - b.ts;
                    });
                }
                node.send({payload: result});
              })
              .catch(console.log);

          });
    }

    RED.nodes.registerType("bucket-read", BucketReadNode);
};
