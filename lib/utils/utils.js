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

  static truncateString(string, limit) {
    if (string.length > limit) {
      return string.substring(0, limit) + "..."
    } else {
      return string
    }
  }

  static isBase64(string) {
    const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    return base64regex.test(string);
  }

  static transformValue(value) {
    switch ( value ) {
      case "":
      case null:
      case undefined:
        return false;
      case true:
      case false:
        return value.toString();
      default:
        return value;
    }
  }

}

module.exports = Utils;
