'use strict';

const http = require('http');
const https = require('https');

// Agent will open new sockets against the Thinger.io server
// until maxSockets value is reached, enqueueing next requests,
// keeping them asyncronous between the same host
const keepAliveAgentHttp = new http.Agent({
    keepAlive: true,
    maxSockets: Infinity, // default
    timeout: 30000 // 30 seconds
});

const keepAliveAgentHttps = new https.Agent({
    keepAlive: true,
    maxSockets: Infinity, // default
    timeout: 30000 // 30 seconds
});

class Request {

    static request(url, method, token, data = {}) {

        var adapterFor = (function() {
            var url = require('url'),
              adapters = {
                'http:': http,
                'https:': https,
            };

            return function(inputUrl) {
              return adapters[url.parse(inputUrl).protocol]
            }
        }());

        var agentFor = (function() {
            var url = require('url'),
              adapters = {
                'http:': keepAliveAgentHttp,
                'https:': keepAliveAgentHttps,
            };

            return function(inputUrl) {
              return adapters[url.parse(inputUrl).protocol]
            }
        }());

        const options = {
          method: method,
          headers: {
            'Authorization': 'Bearer '+token,
            'Content-Type': 'application/json; charset=utf-8'
          },
          timeout: 10000, // in ms
          agent: agentFor(url)
        };

        const dataString = JSON.stringify(data);
        if (method === "POST" || method === "PUT") {
            options.headers['Content-Length'] = Buffer.byteLength(dataString, 'utf8');
        }

        return new Promise((resolve, reject) => {
          const req = adapterFor(url).request(url, options, (res) => {
            console.log(`${res.statusCode} ${method} ${url}`);
            if (res.statusCode == 401) {
              return reject(new Error(`Invalid JWT. Check Thinger server configuration`));
            }
            if (res.statusCode == 404) {
              return resolve({code : res.statusCode, msg: "not found"});
            }
            if (res.statusCode >= 400) {
              return reject(new Error(`${res.statusMessage}. Check node configuration`));
            }
            if (res.statusCode < 200 || res.statusCode > 299) {
              return reject(new Error(`HTTP status code ${res.statusCode}`));
            }

            const body = [];
            res.on('data', (chunk) => body.push(chunk));
            res.on('end', () => {
              const res = Buffer.concat(body).toString();
              resolve(!res ? res : JSON.parse(res));
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
              req.write(dataString);
          }

          req.end();
        }).catch(err => {return Promise.reject(err)});
    }
}

module.exports = Request;
