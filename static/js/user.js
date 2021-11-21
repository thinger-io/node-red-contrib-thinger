'use strict';

class ThingerUser {

    #_url = "users/user";

    constructor() {
        var self = this;

        $.ajax({
            url: this.#_url,
            async: false, // TODO: make async
            dataType: 'json',
            success: function(data) {
                self.role = data.role;
            }
        });
    }

}
