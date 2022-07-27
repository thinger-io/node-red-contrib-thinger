'use strict';

class ThingerUser {

    #_url = "users/user";

    constructor(svr_id="") {
        var self = this;

        $.ajax({
            url: `${this.#_url}?svr_id=${svr_id}`,
            async: false, // TODO: make async
            dataType: 'json',
            success: function(data) {
                self.role = data.role;
            }
        });
    }

}
