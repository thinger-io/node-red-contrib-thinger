'use strict';

class ThingerAssets {

    _url = "server/assets"; // can't be private as it is used by children

    constructor(url,node_id,svr_id="",role="user") {
        if (url) {
            this._url=url;
        }
        this.node_id = node_id;
        this.svr_id = svr_id;
        this.role = role;
    }

    async getAssets() {
        if (this._assets !== undefined) return Promise.resolve(this._assets);

        this._assets = [];
        const self = this;
        return this.request()
        .then(function(data) {
            for (let i in data) {
                if (self.role === "admin" || !data[i].hasOwnProperty("role") || data[i].role !== "admin") {
                    self._assets.push(
                      data[i].asset
                    );
                }
            }
            return self._assets;
        });
    }

    request() {
        if (this._url.includes('?'))
            return $.getJSON(`${this._url}&node_id=${this.node_id}&svr_id=${this.svr_id}`);
        else
            return $.getJSON(`${this._url}?node_id=${this.node_id}&svr_id=${this.svr_id}`);
    }

}

class ThingerAsset {

    #_url = "assets";

    constructor(type,node_id,svr_id="") {
        this.type = type;
        this.node_id = node_id;
        this.svr_id = svr_id;
    }

    async getProperties() {
        if (this._properties !== undefined) return Promise.resolve(this._properties);

        this._properties = [];
        const self = this;
        return $.getJSON(`${this.#_url}/${this.type}s/${this.id}/properties?node_id=${this.node_id}&svr_id=${this.svr_id ? this.svr_id : ""}`).
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
    }

    getPropertyValue(id) {
        const property = this._properties.find(e=>e.id === id);
        if (property !== undefined) {
            return property.value;
        }
        return undefined;
    }

}

class ThingerDevices extends ThingerAssets {

    constructor(name,node_id,svr_id="") {
        const _url = "assets/devices";
        super(`${_url}?name=${name}`,node_id,svr_id,"user");
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
                    self.node_id,
                    self.svr_id,
                    data[i].connection.active, // after node_id and svr_id as groups and types don't have similar property
                    data[i].type // type is last as other assets don't have a similar property
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

    constructor(id,name,node_id,svr_id="",active=false,type="") {
        super("device",node_id,svr_id);
        this.id = id;
        this.name = name;
        this.active = active;
        this.device_type = type;
    }

    async getResources() {
        if (this._resources !== undefined) return Promise.resolve(this._resources);

        this._resources = [];
        const self = this;
        return $.getJSON(`${this.#_url}/${this.type}s/${this.id}/resources?node_id=${this.node_id}&svr_id=${this.svr_id ? this.svr_id : ""}`).
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
                if ( ! data[i].id.startsWith('$') && (data[i].withoutParams() || data[i].isInput() || data[i].isInputOutput())) { // no params still need a way to be called
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
                if ( ! data[i].id.startsWith('$') && (data[i].isOutput() || data[i].isInputOutput())) {
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
                if ( ! data[i].id.startsWith('$') && (data[i].isInputOutput())) {
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
        if (fn === 1)
          this.name = "no parameters";
        else if (fn === 2)
          this.name = "input";
        else if (fn === 3)
          this.name = "output";
        else if (fn === 4)
          this.name = "input/output";
    }

    withoutParams() {
        return this.fn === 1;
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

    constructor(name,node_id,svr_id="") {
        const _url = "assets/buckets";
        super(`${_url}?name=${name}`,node_id,svr_id);
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
                    data[i].enabled,
                    data[i].config.tags,
                    self.node_id,
                    self.svr_id
                ));
            }
            return self._buckets;
        });

    }

    async getAssets() {
        return this.getBuckets();
    }

    getBucketTagsName(id) {
      const bucket = this._buckets.find(e=>e.id === id);
      if (bucket !== undefined) {
        return bucket.getTagsName();
      }
      return [];
    }

    async getBucketTagsValue(id, tag) {
      const bucket = this._buckets.find(e=>e.id === id);
      if (bucket !== undefined) {
        return bucket.getTagValues(tag);
      }
      return Promise.resolve([]);
    }

}

class ThingerBucket extends ThingerAsset {

    #_url = "assets";

    constructor(id, name, active, tags, node_id, svr_id = "") {
        super("bucket");
        this.id = id;
        this.name = name;
        this.active = active;
        this.tags = {};
        for (let i in tags) {
          this.tags[tags[i]] = [];
        }
        this.node_id = node_id;
        this.svr_id = svr_id;
    }

    getTagsName() {
      return Object.getOwnPropertyNames(this.tags);
    }

    async getTagValues(id) {
      if ( ! this.tags.hasOwnProperty(id) )
        return Promise.resolve([]);

      if ( this.tags[id].length === 0 ) {
        this.tags[id] = $.getJSON(`${this.#_url}/${this.type}s/${this.id}/tags/${id}?node_id=${this.node_id}&svr_id=${this.svr_id ? this.svr_id : ""}`);
      }

      return this.tags[id];
    }

}

class ThingerEndpoints extends ThingerAssets {

    constructor(name,node_id,svr_id="") {
        const _url = "assets/endpoints";
        super(`${_url}?name=${name}`,node_id,svr_id);
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
        return this.getEndpoints();
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

    constructor(name,node_id,svr_id="") {
        const _url = "assets/types";
        super(`${_url}?name=${name}`,node_id,svr_id);
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
                    data[i].name,
                    self.node_id,
                    self.svr_id
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

    constructor(id, name, node_id, svr_id = "") {
        super("type");
        this.id = id;
        this.name = name;
        this.node_id = node_id;
        this.svr_id = svr_id;
    }

}

class ThingerGroups extends ThingerAssets {

    constructor(name,node_id,svr_id="") {
        const _url = "assets/groups";
        super(`${_url}?name=${name}`,node_id,svr_id);
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
                    data[i].name,
                    self.node_id,
                    self.svr_id
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

    constructor(id, name, node_id, svr_id = "") {
        super("group");
        this.id = id;
        this.name = name;
        this.node_id = node_id;
        this.svr_id = svr_id;
    }

}

class ThingerProducts extends ThingerAssets {

    constructor(name,node_id,svr_id="") {
        const _url = "assets/products";
        super(`${_url}?name=${name}`,node_id,svr_id);
    }

    getProducts() {
        if (this._products !== undefined) return Promise.resolve(this._products);

        this._products = [];
        const self = this;
        return super.request()
        .then(function(data) {
            for (let i in data) {
                self._products.push(
                  new ThingerProduct(
                    data[i].product,
                    data[i].name,
                    self.node_id,
                    self.svr_id,
                    data[i].enabled // After node_id and svr_id as types and groups don't have a similar property
                ));
            }
            return self._products;
        });

    }

    async getAssets() {
        return this.getProducts();
    }

}

class ThingerProduct extends ThingerAsset {

    constructor(id, name, node_id, svr_id = "",active=false) {
        super("product");
        this.id = id;
        this.name = name;
        this.active = active;
        this.node_id = node_id;
        this.svr_id = svr_id;
    }

}

class ThingerProperty {

    constructor(id,value) {
        this.id = id;
        this.value = value;
    }
}


class ThingerStorages extends ThingerAssets {

    constructor(name,node_id,svr_id="") {
        const _url = "assets/storages";
        //super(`${_url}?name=${name}`,node_id,svr_id,"user");
        super(`${_url}?name=${name}`,node_id,svr_id,"user");
    }

    async getStorages() {

        if (this._storages !== undefined) return Promise.resolve(this._storages);

        this._storages = [];
        const self = this;
        return super.request()
        .then(function(data) {
            for (let i in data) {
                self._storages.push(
                  new ThingerStorage(
                    data[i].storage,
                    data[i].name,
                    self.node_id,
                    self.svr_id
                ));
            }
            return self._storages;
        });
    }

    async getAssets() {
        return this.getStorages();
    }

    async getStorageFiles(id) {
        const storage = this._storages.find(e=>e.id === id);
        if (storage !== undefined) {
            return storage.getFiles();
        }
        return Promise.resolve([]);
    }

}

class ThingerStorage extends ThingerAsset {

    #_url = "assets";

    constructor(id, name, node_id, svr_id = "") {
        super("storage");
        this.id = id;
        this.name = name;
        this.node_id = node_id;
        this.svr_id = svr_id;
    }

    async getFiles() {
        if (this._files !== undefined) return Promise.resolve(this._files);

        this._files = [];
        const self = this;
        return $.getJSON(`${this.#_url}/${this.type}s/${this.id}/files?node_id=${this.node_id}&svr_id=${this.svr_id ? this.svr_id : ""}`).
        then(function(data) {
            for (let i in data) {
                self._files.push(
                  new ThingerFile(
                    data[i].name,
                    data[i].path,
                    data[i].size,
                    data[i].type
                  )
                );
            }
            return self._files;
        });
    }

}

class ThingerFile {

    // type can be "file" or "directory"
    constructor(name,path,size,type) {
        this.id = path;
        this.name = type; // using type for show options in DOM
    }

    isDirectory() {
        return this.name === "directory" ? true : false;
    }

}

class ThingerAlarmRules extends ThingerAssets {

    constructor(name,node_id,svr_id="") {
        const _url = "assets/alarms/rules";
        super(`${_url}?name=${name}`,node_id,svr_id);
    }

    getRules() {
        if (this._rules !== undefined) return Promise.resolve(this._rules);

        this._rules = [];
        const self = this;
        return super.request()
        .then(function(data) {
            for (let i in data) {
                self._rules.push(
                  new ThingerAlarmRule(
                    data[i].rule,
                    data[i].name,
                    data[i].enabled,
                    self.node_id,
                    self.svr_id
                ));
            }
            return self._rules;
        });

    }

    async getAssets() {
        return this.getRules();
    }

}

class ThingerAlarmRule extends ThingerAsset {

    constructor(id, name, active, node_id, svr_id = "") {
        super("rule");
        this.id = id;
        this.name = name;
        this.active = active;
        this.node_id = node_id;
        this.svr_id = svr_id;
    }

}

class ThingerAlarmInstances extends ThingerAssets {

    constructor(name,node_id,svr_id="") {
        const _url = "assets/alarms/instances";
        super(`${_url}?name=${name}`,node_id,svr_id);
    }

    getInstances() {
        if (this._instances !== undefined) return Promise.resolve(this._instances);

        this._instances = [];
        const self = this;
        return super.request()
        .then(function(data) {
            for (let i in data) {
                self._instances.push(
                  new ThingerAlarmInstance(
                    data[i].instance,
                    data[i].name,
                    self.node_id,
                    self.svr_id
                ));
            }
            return self._instances;
        });

    }

    async getAssets() {
        return this.getInstances();
    }

}

class ThingerAlarmInstance extends ThingerAsset {

    constructor(id, name, node_id, svr_id = "") {
        super("instance");
        this.id = id;
        this.name = name;
        this.node_id = node_id;
        this.svr_id = svr_id;
    }

}

class ThingerProjects extends ThingerAssets {

    constructor(name,node_id,svr_id="") {
        const _url = "assets/projects";
        super(`${_url}?name=${name}`,node_id,svr_id);
    }

    getProjects() {
        if (this._projects !== undefined) return Promise.resolve(this._projects);

        this._projects = [];
        const self = this;
        return super.request()
        .then(function(data) {
            for (let i in data) {
console.log(data);
                self._projects.push(
                  new ThingerProject(
                    data[i].project,
                    data[i].name,
                    self.node_id,
                    self.svr_id
                ));
            }
            return self._projects;
        });

    }

    async getAssets() {
        return this.getProjects();
    }

}

class ThingerProject extends ThingerAsset {

    constructor(id, name, node_id, svr_id = "") {
        super("project");
        this.id = id;
        this.name = name;
        this.node_id = node_id;
        this.svr_id = svr_id;
    }

}

// Lexical declaration of classes
const assetClass = new Map([
    ['storages', ThingerStorages], ['storage', ThingerStorage],
    ['endpoints', ThingerEndpoints], ['endpoint', ThingerEndpoint],
    ['rules', ThingerAlarmRules], ['rule', ThingerAlarmRule],
    ['buckets', ThingerBuckets], ['bucket', ThingerBucket],
    ['devices', ThingerDevices], ['device', ThingerDevice],
    ['types', ThingerTypes], ['type', ThingerType],
    ['assetTypes', ThingerTypes], ['assetType', ThingerType],
    ['groups', ThingerGroups], ['group', ThingerGroup],
    ['assetGroups', ThingerGroups], ['assetGroup', ThingerGroup],
    ['products', ThingerProducts], ['product', ThingerProduct],
    ['projects', ThingerProjects], ['project', ThingerProject]
    ]);

