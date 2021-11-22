# node-red-contrib-thinger

[![NPM Version](https://img.shields.io/static/v1?label=npm&message=v1.2.1&color=blue&style=flat)](https://www.npmjs.com/package/node-red-contrib-thinger)

![Node-RED and Thinger.io Integration](https://gblobscdn.gitbook.com/assets%2F-LpXqB3J1BMD5s4OpYSg%2F-LqolIqYDvSBb7V2MiNj%2F-LqpE9l6dUWZx6GQe8NQ%2Fimage.png?alt=media&token=35ce9cca-cec8-45db-b298-d973f2bb7f9b "Thinger.io web console with Node-RED plugin and ad-hoc nodes")

Nodes to assist with the integration, automation and communication of [Node-RED](https://nodered.org/) and IoT devices with [Thinger.io](https://thinger.io/)

To see what has changed in recent versions, have a look a the project's [Changelog](https://github.com/thinger-io/Node-RED/blob/master/CHANGELOG.md).

## Getting Started

Documentation regarding the module and nodes can be found [here](https://docs.thinger.io/plugins/node-red).

### Prerequisites

#### Cloud
Have a valid [Thinger.io](https://thinger.io/) cloud [instance](https://pricing.thinger.io/#!/cloud) with capacity to install a new plugin.

#### Local
Have a local instance of [Node-RED](https://nodered.org/) with the following characteristics:
- [Node.js](https://nodejs.org) - v12.0 or newer
- [Node-RED](https://NodeRED.org) - v1.0.0 or newer

### Installation

#### Cloud
To install the plugin on the [Thinger.io](https://thinger.io) instance follow the instructions from the [documentation](https://docs.thinger.io/plugins).

#### Local

To install the stable version use the `Menu - Manage palette - Install` 
option and search for `node-red-contrib-thinger`, or run the following 
command in your Node-RED user directory:

    npm install node-red-contrib-thinger

To connect the [Node-RED](https://NodeRED.org) instance to [Thinger.io](https://thinger.io) follow the instructions from [here](https://docs.thinger.io/plugins/node-red#starting-with-thinger-io-nodes).

## Nodes
Once installed, detailed documentation of each node can be found in the `Help` dialog of [Node-RED](https://NodeRED.org).
Below is a brief description of the actions allowed:
- Iterate over the assets from the Thinger.io Platform (asset iterator node).
- Create buckets when an event occurs (bucket create node).
- Read from data buckets (bucket read node).
- Writing to data buckets (bucket write node).
- Calling devices callbacks with autoprovisioning (device callback node).
- Creating any type of devices (device create node).
- Reading a device resource when an event occurs (device read node).
- Subscribing to device resources at a given interval (device stream node).
- Sending data to a connected device (device write node).
- Calling endpoints (endpoint call node).
- Reading properties of devices, types or groups (property read node).
- Writing and modifying properties of devices, types or groups (property write node).
- Detecting different events of devices, buckets, endpoints and others (server events node).

## License

<img align="right" src="https://opensource.org/trademarks/opensource/OSI-Approved-License-100x137.png">

The class is licensed under the [MIT License](http://opensource.org/licenses/MIT):

Copyright &copy; [Thinger.io](http://thinger.io)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
