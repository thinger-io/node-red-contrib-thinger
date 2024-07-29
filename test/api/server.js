'use strict';

const http = require('http');
const WebSocket = require('ws');

// Create an HTTP server
const server = http.createServer();

// Create a new WebSocket server
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {

    //console.log("Client connected");

    ws.on('message', (message) => {
        //console.log(`Received message => ${message}`);

        const body = JSON.parse(message);

        if ( body.event === 'bucket_export_completed' ) {

            const response = require('./responses/events/bucket_export_completed.json');

            // We give it some time for the export request to execute
            setInterval(function () {
                ws.send(JSON.stringify(response));
            }, 500);


        }

    });

    ws.on('close', () => {
        //console.log("Client disconnected");
    });

    // Handle errors
    ws.on('error', (error) => {
        //console.log(`WebSocket server error => ${error}`);
    });

});

// Handle HTTP upgrade requests to upgrade them to WebSocket requests
server.on('upgrade', (request, socket, head) => {

    const pathname = request.url;

    if ( pathname.includes('/v1/users/thinger/events') ) {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

//server.listen(80, () => {
//   console.log('Server is listening on http://localhost:80');
//});

module.exports = server;