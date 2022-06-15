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

    static gcd(arr){
        let i, y,
            n = arr.length,
            x = Math.abs(arr[0]);

        for (i = 1; i < n; i++) {
            y = Math.abs(arr[i]);
            while (x && y) {
                (x > y) ? x %= y : y %= x;
            }
            x += y;
        }
        return x;
    }

}

module.exports = Utils;
