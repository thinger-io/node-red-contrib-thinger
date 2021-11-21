'use strict';

class Utils {

    static sortObjectArray(array, property) {
        let array_ = array;
        array_.sort(function (a, b) {
            if (a[property] > b[property]) return 1;
            if (a[property] < b[property]) return -1;
            return 0;
        });
        return array_
    }

}

module.exports = Utils;
