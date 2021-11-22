'use strict';

class ThingerAssets {

    _url = "server/assets"; // can't be private as it is used by children

    constructor(url,role="user") {
        if (url) {
            this._url=url;
        }
        this.role = role;
    }

    async getAssets() {
        if (this._assets !== undefined) return Promise.resolve(this._assets);

        this._assets = [];
        const self = this;
        return this.request()
        .then(function(data) {
            for (let i in data) {
                if (self.role === "admin" || !data[i].hasOwnProperty("role") ||data[i].role !== "admin") {
                    self._assets.push(
                      data[i].asset
                    );
                }
            }
            return self._assets;
        });
    }

    request() {
        return $.getJSON(this._url);
    }

}

class ThingerAsset {

    #_url = "assets";

    constructor(type) {
        this.type = type;
    }

    async getProperties() {
        if (this._properties !== undefined) return Promise.resolve(this._properties);

        this._properties = [];
        const self = this;
        return $.getJSON(`${this.#_url}/${this.type}s/${this.id}/properties`).
        then(function(data) {
            for (let i in data) {
                self._properties.push(
                  new ThingerProperty(
                    data[i].property,
                    data[i].value
                  )
                );
            }
            return self._properties;
        });
    };

    getPropertyValue(id) {
        const property = this._properties.find(e=>e.id === id);
        if (property !== undefined) {
            return property.value;
        }
        return {};
    }

}

class ThingerDevices extends ThingerAssets {

    constructor(name="") {
        const _url = "assets/devices";
        super(`${_url}?name=${name}`);
    }

    async getDevices() {

        if (this._devices !== undefined) return Promise.resolve(this._devices);

        this._devices = [];
        const self = this;
        return super.request()
        .then(function(data) {
            for (let i in data) {
                self._devices.push(
                  new ThingerDevice(
                    data[i].device,
                    data[i].name,
                    data[i].type,
                    data[i].connection.active
                ));
            }
            return self._devices;
        });
    }

    async getAssets() {
        return this.getDevices();
    }

    async getDeviceResources(id) {
        const device = this._devices.find(e=>e.id === id);
        if (device !== undefined) {
            return device.getResources();
        }
        return Promise.resolve([]);
    }

    async getDeviceInputResources(id) {
        const device = this._devices.find(e=>e.id === id);
        if (device !== undefined) {
            return device.getInputResources();
        }
        return Promise.resolve([]);
    }

    async getDeviceOutputResources(id) {
        const device = this._devices.find(e=>e.id === id);
        if (device !== undefined) {
            return device.getOutputResources();
        }
        return Promise.resolve([]);
    }

    async getDeviceInputOutputResources(id) {
        const device = this._devices.find(e=>e.id === id);
        if (device !== undefined) {
            return device.getInputOutputResources();
        }
        return Promise.resolve([]);
    }

    async getHTTPDevices() {
        let httpDevices = [];
        return this.getDevices().then(function(data) {
            for (let i in data) {
                if (data[i].isHTTP()) {
                    httpDevices.push(data[i]);
                }
            }
            return httpDevices;
        });
    }
}

class ThingerDevice extends ThingerAsset {

    #_url = "assets";

    constructor(id,name="",type,active=false) {
        super("device");
        this.id = id;
        this.name = name;
        this.active = active;
        this.device_type = type;
    }

    async getResources() {
        if (this._resources !== undefined) return Promise.resolve(this._resources);

        this._resources = [];
        const self = this;
        return $.getJSON(`${this.#_url}/${this.type}s/${this.id}/resources`).
        then(function(data) {
            for (let i in data) {
                self._resources.push(
                  new ThingerResource(
                    i,
                    data[i].fn
                  )
                );
            }
            return self._resources;
        });
    }

    async getInputResources() {
        let inputResources = [];
        return this.getResources().then(function (data) {
            for (let i in data) {
                if (data[i].isInput()) {
                    inputResources.push(data[i]);
                }
            }
            return inputResources;
        });
    }

    async getOutputResources() {
        let outputResources = [];
        return this.getResources().then(function (data) {
            for (let i in data) {
                if (data[i].isOutput()) {
                    outputResources.push(data[i]);
                }
            }
            return outputResources;
        });
    }

    async getInputOutputResources() {
        let inputOutputResources = [];
        return this.getResources().then(function (data) {
            for (let i in data) {
                if (data[i].isInputOutput()) {
                    inputOutputResources.push(data[i]);
                }
            }
            return inputOutputResources;
        });
    }

    isHTTP() {
        return this.device_type === "HTTP";
    }

}

class ThingerResource {

    // fn -> function type
    //  1: no parameters
    //  2: input
    //  3: output
    //  4: input & output
    constructor(id,fn) {
        this.id = id;
        this.fn = fn;
    }

    isInput() {
        return this.fn === 2;
    }

    isOutput() {
        return this.fn === 3;
    }

    isInputOutput() {
        return this.fn === 4;
    }

}
class ThingerBuckets extends ThingerAssets {

    constructor(name="") {
        const _url = "assets/buckets";
        super(`${_url}?name=${name}`);
    }

    getBuckets() {
        if (this._buckets !== undefined) return Promise.resolve(this._buckets);

        this._buckets = [];
        const self = this;
        return super.request()
        .then(function(data) {
            for (let i in data) {
                self._buckets.push(
                  new ThingerBucket(
                    data[i].bucket,
                    data[i].name,
                    data[i].enabled
                ));
            }
            return self._buckets;
        });

    }

    async getAssets() {
        return this.getGroups();
    }

}

class ThingerBucket extends ThingerAsset {

    constructor(id, name, active) {
        super("bucket");
        this.id = id;
        this.name = name;
        this.active = active;
    }

}

class ThingerEndpoints extends ThingerAssets {

    constructor(name="") {
        const _url = "assets/endpoints";
        super(`${_url}?name=${name}`);
    }

    getEndpoints() {
        if (this._endpoints !== undefined) return Promise.resolve(this._endpoints);

        this._endpoints = [];
        const self = this;
        return super.request()
        .then(function(data) {
            for (let i in data) {
                self._endpoints.push(
                  new ThingerEndpoint(
                    data[i].endpoint,
                    data[i].name,
                    data[i].enabled
                ));
            }
            return self._endpoints;
        });

    }

    async getAssets() {
        return this.getEdnpoints();
    }

}

class ThingerEndpoint extends ThingerAsset {

    constructor(id, name, active) {
        super("endpoint");
        this.id = id;
        this.name = name;
        this.active = active;
    }

}

class ThingerTypes extends ThingerAssets {

    constructor(name="") {
        const _url = "assets/types";
        super(`${_url}?name=${name}`);
    }

    async getTypes() {

        if (this._types !== undefined) return Promise.resolve(this._types);

        this._types = [];
        const self = this;
        return super.request()
        .then(function(data) {
            for (let i in data) {
                self._types.push(
                  new ThingerType(
                    data[i].type,
                    data[i].name
                ));
            }
            return self._types;
        });
    }

    async getAssets() {
        return this.getTypes();
    }

}

class ThingerType extends ThingerAsset {

    constructor(id, name) {
        super("type");
        this.id = id;
        this.name = name;
    }

}

class ThingerGroups extends ThingerAssets {

    constructor(name="") {
        const _url = "assets/groups";
        super(`${_url}?name=${name}`);
    }

    getGroups() {
        if (this._groups !== undefined) return Promise.resolve(this._groups);

        this._groups = [];
        const self = this;
        return super.request()
        .then(function(data) {
            for (let i in data) {
                self._groups.push(
                  new ThingerGroup(
                    data[i].group,
                    data[i].name
                ));
            }
            return self._groups;
        });

    }

    async getAssets() {
        return this.getGroups();
    }

}

class ThingerGroup extends ThingerAsset {

    constructor(id, name) {
        super("group");
        this.id = id;
        this.name = name;
    }

}

class ThingerProperty {

    constructor(id,value) {
        this.id = id;
        this.value = value;
    }
}

// Lexical declaration of classes
const assetClass = new Map([
    ['devices', ThingerDevices], ['device', ThingerDevice],
    ['types', ThingerTypes], ['type', ThingerType],
    ['groups', ThingerGroups], ['group', ThingerGroup]
    ]);


