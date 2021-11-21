'use strict';

class ThingerEvents {

    #_url = "server/events";

    constructor(role="user") {
        var self = this;
        $.ajax({
            url: this.#_url,
            async: false, // TODO: make async
            dataType: 'json',
            success: function(data) {
                self.events = [];
                for (let i in data) {
                    if (role === "admin" || data[i].role !== "admin") {
                        self.events.push(
                          new Event(
                            data[i].event,
                            data[i].filters
                        ));
                    }
                }
            }
        });

        this.#addAnyEvent();

    }

    #addAnyEvent() {
      this.assets.forEach(asset => {
          this.events.unshift(new Event("any", [{"field": asset}]));
      });
    }

    get assets() {
        if (this._assets !== undefined) return this._assets;

        let assets = new Set(); // keeps unique values unlike arrays

        this.events.forEach(event => {
            assets.add(event.asset);
        });

        this._assets = assets;
        return this._assets;
    }

    // returns the events associated with an asset
    assetEvents(asset) {

        const assetEvents = new Set();

        this.events.forEach(event => {
            if (event.asset === asset || asset === "") {
                assetEvents.add(event.name);
            }
        });

        return assetEvents;
    }

    event(name) {
        return this.events.find(e=>e.name === name);
    }

    exists(name) {
        return this.events.find(e=>e.name === name) ? true : false;
    }

}

class ThingerEvent {

    constructor(name,filters) {

        let filters_ = filters;

        this.name = name;
        this.asset = filters_.shift().field; // It should never have hints associated
        this.filters = filters_; // array of rest of filters with hints associated

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
