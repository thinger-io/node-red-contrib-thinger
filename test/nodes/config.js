'use strict';

class Config {

    static _server = {
        id: "n0",
        type: "thinger-server",
        name: "thinger-server",
        host: "localhost:8080",
        credentials: {
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJub2RlX3JlZF9wbHVnaW4iLCJzdnIiOiJsb2NhbGhvc3Q6ODA4MCIsInVzciI6InRoaW5nZXIifQ.dUbylNxnyIZyBjK-17MdcUTCmK2Ky2rbK7DMHbomwKQ"
        },
        ssl: false
    };

    static getServer() {
        return Config._server;
    }

    static getCredentials() {
        let credentials = {};
        credentials[Config._server.id] = Config._server.credentials;
        return credentials;
    }

    static getServerId() {
        return Config._server.id;
    }

}

module.exports = Config;