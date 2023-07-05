'use strict';

class ThingerEvents {

    _url = "server/events";

    constructor(node_id,svr_id="",role="user") {
        this.node_id = node_id;
        this.svr_id = svr_id;
        this.role = role;
    }

    async getEvents() {
        if (this._events !== undefined) return Promise.resolve(this._events);

        this._events = [];
        const self = this;
        return this.request()
        .then(function(data) {
            for (let i in data) {
                if (self.role === "admin" || !data[i].hasOwnProperty("role") || data[i].role !== "admin") {
                    self._events.push(
                      new ThingerEvent(
                        data[i].event,
                        data[i].filters
                    ));
                }
            }
            return self._events;
        });
    }

    request() {
        if (this._url.includes('?'))
            return $.getJSON(`${this._url}&node_id=${this.node_id}&svr_id=${this.svr_id}`);
        else
            return $.getJSON(`${this._url}?node_id=${this.node_id}&svr_id=${this.svr_id}`);
    }

    getAssetEvents(asset) {

        const assetEvents = new Set();

        assetEvents.add("any");

        this._events.forEach(event => {
            if (event.name.startsWith(asset) || asset === "") {
                assetEvents.add(event.name);
            }
        });

        return assetEvents;
    }

    exists(name) {
        return this._events.find(e=>e.name === name) ? true : false;
    }

    event(name) {
        return this._events.find(e=>e.name === name);
    }

}

class ThingerEvent {

    constructor(name,filters) {

        let filters_ = filters;

        this.name = name;
        this.filters = filters; // array of rest of filters with hints associated

        this.#addAnyHint();

    }

    #addAnyHint() {
      this.filters.forEach(filter => {
            if (filter.hasOwnProperty("hints")) {
                filter.hints.unshift("any");
            }
      });
    }

}
