'use strict';

//const http = require('http');
//const https = require('https');

class Request {

    static request(url, method, token, data = {}) {
    //static async function request(url, method, data = {}) {

        var adapterFor = (function() {
            var url = require('url'),
              adapters = {
                'http:': require('http'),
                'https:': require('https'),
            };

            return function(inputUrl) {
              return adapters[url.parse(inputUrl).protocol]
            }
        }());

        const options = {
          method: method,
          headers: {
            'Authorization': 'Bearer '+token,
            'Content-Type': 'application/json'
          },
          timeout: 1000, // in ms
        };

        const dataString = JSON.stringify(data);
        if (method === "POST" || method === "PUT") {
            options.headers['Content-Length'] = dataString.length;
        }

        return new Promise((resolve, reject) => {
          const req = adapterFor(url).request(url, options, (res) => {
            console.log(`${res.statusCode} ${method} ${url}`);
            //if (res.statusCode < 200 || res.statusCode > 299) {
            //  return reject(new Error(`HTTP status code ${res.statusCode}`));
            //}

            const body = [];
            res.on('data', (chunk) => body.push(chunk));
            res.on('end', () => {
              const res = Buffer.concat(body).toString();
              resolve(!res ? res : JSON.parse(res));
            });
          });

          req.on('error', (err) => {
            reject(err);
          });

          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request time out'));
          });

          if (method === "POST" || method === "PUT") {
              req.write(dataString);
          }

          req.end();
        });
    }
}

module.exports = Request;
