'use strict';

const http = require('http');
const https = require('https');

class Request {

    // Agent will open new sockets against the Thinger.io server
    // until maxSockets value is reached, enqueueing next requests,
    // keeping them asyncronous between the same host
    #keepAliveAgentHttp = new http.Agent({
      keepAlive: true,
      //maxSockets: Infinity, // default
      timeout: 30000 // 30 seconds
    });

    #keepAliveAgentHttps = new https.Agent({
      keepAlive: true,
      //maxSockets: Infinity, // default
      timeout: 30000 // 30 seconds
    });

    constructor(token, maxSockets, requestTimeout) {
        this.token = token;

        let options = {};

        if ( typeof maxSockets !== 'undefined' && maxSockets !== "" && maxSockets !== "0" ) {
          options.maxSockets = parseInt(maxSockets);
        }

        if ( typeof requestTimeout !== 'undefined' && requestTimeout !== "" && requestTimeout !== "0" ) {
          options.timeout = parseInt(requestTimeout) * 1000; // to milliseconds
        } else {
          options.timeout = 30000; // 30 seconds
        }

        if ( Object.keys(options).length !== 0 ) {

          options.keepAlive = true;

          this.#keepAliveAgentHttp = new http.Agent( options );
          this.#keepAliveAgentHttps = new https.Agent( options );

        }

    }

    request(url, method, data) {

        const self = this;

        const adapterFor = (function() {
            const urlLib = require('url'),
              adapters = {
                'http:': http,
                'https:': https,
            };

            return function(inputUrl) {
              return adapters[urlLib.parse(inputUrl).protocol]
            }
        }());

        const agentFor = (function() {
            const urlLib = require('url'),
              adapters = {
                'http:': self.#keepAliveAgentHttp,
                'https:': self.#keepAliveAgentHttps,
            };

            return function(inputUrl) {
              return adapters[urlLib.parse(inputUrl).protocol]
            }
        }());

        const options = {
          method: method,
          headers: {
            'Authorization': 'Bearer '+this.token
          },
          //timeout: 10000, // in ms
          agent: agentFor(url)
        };

        // Set data and header for content
        let dataString;
        if (typeof data !== 'undefined') {
            dataString = typeof data === 'object' && !Buffer.isBuffer(data) ? JSON.stringify(data) : data;
            if (method === "POST" || method === "PUT") {
                if (Buffer.isBuffer(data)) {
                    options.headers['Content-Length'] = dataString.length;
                    options.headers['Content-Type'] = 'application/octec-stream;';
                } else {
                    options.headers['Content-Length'] = Buffer.byteLength(dataString, 'utf8');
                    options.headers['Content-Type'] = 'application/json; charset=utf-8';
                }
            }
        }

        // Limit maximum upload to 256MB
        if ( parseInt(options.headers['Content-Length'], 10) > 256000000 ) {
          throw(new Error('Request size is bigger than 256MB'));
        }

        return new Promise((resolve, reject) => {
          const req = adapterFor(url).request(url, options, (res) => {

            //console.log(`${res.statusCode} ${method} ${url} ${ typeof data === 'object' ? JSON.stringify(data) : data }`);

            // If file/content is bigger than 256MB
            let size = parseInt( res.headers['content-length'], 10 );
            if ( size > 256000000 ) {
              req.destroy();
              return reject(new Error('Response size is bigger than 256MB'));
            }

            const body = [];
            res.on('data', (chunk) => body.push(chunk));
            res.on('end', () => {

              let message = Buffer.concat(body);
              if (res.headers.hasOwnProperty('content-type')) { // res.headers is a class property, not an object property
                let contentType = res.headers['content-type'];

                if (contentType.startsWith('application/json')) {
                  // Try to parse json from response
                  try { message = JSON.parse(message); }
                  catch (e) { message = message.toString(); }
                }
                else if (res.headers['content-type'].startsWith('image'))
                    message = Buffer.concat(body).toString('base64');
                else if (contentType.startsWith('text') || contentType.startsWith('application/xml')
                         || contentType.startsWith('application/rtf') || contentType.startsWith('application/xhtml')
                         || contentType.startsWith('application/atom'))
                    message = message.toString();

              }

              let error_message = "";
              if (message && typeof message === 'object' && message.hasOwnProperty('error'))
                error_message = message.error.message;

              if (res.statusCode == 400) {
                let err = new Error(`${res.statusMessage}${ error_message ? ' ('+error_message+')' : ''}.`);
                err.status = res.statusCode;
                return reject(err);
              }
              if (res.statusCode == 401) {
                // Invalid JWT
                let err = new Error(`Unauthorized access. Check node configuration.`);
                err.status = res.statusCode;
                return reject(err);
              }
              if (res.statusCode == 403) {
                let err = new Error(`Forbidden. The credentials used can't access the resource.`);
                err.status = res.statusCode;
                return reject(err);
              }
              if (res.statusCode == 404) {
                return resolve({status : res.statusCode, error: "not found"});
              }
              if (res.statusCode >= 400) {
                let err = new Error(`${res.statusMessage}. Check node configuration${ error_message ? ' ('+error_message+')' : ''}.`);
                err.status = res.statusCode;
                return reject(err);
              }
              if (res.statusCode < 200 || res.statusCode > 299) {
                let err = new Error(`HTTP status code ${res.statusCode}${ error_message ? ' ('+error_message+')' : ''}.`);
                err.status = res.statusCode;
                return reject(err);
              }

              resolve({status: res.statusCode, payload: message});
            });

          });

          req.on('error', (err) => {
            return reject(err);
          });

          req.on('timeout', () => {
            req.destroy();
            return reject(new Error('Request time out'));
          });

          if (method === "POST" || method === "PUT") {
              if (typeof dataString !== 'undefined')
                  req.write(dataString);
          }

          req.end();
        }).catch(err => {return Promise.reject(err)});
    }
}

module.exports = Request;
