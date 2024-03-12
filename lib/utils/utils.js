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
        return null;
      case true:
      case false:
        return value.toString();
      default:
        return value;
    }
  }

  static isTemplated(value) {

    if ( typeof value !== 'number')
      return (value||"").indexOf("{{") !== -1;
    return false;
  }

  // This function is called only when needed, and not for the full Node config to avoid converting and parsing always
  // an Object when it can just be done for a string
  static mustacheRender(template, views) {
    const mustache = require('mustache');

    if ( typeof template === 'object' ) {

      // Render an array of strings and return
      if ( Array.isArray(template) ) {
        let data = [];
        for (let i = 0; i < template.length; i++ ) {
          if ( Utils.isTemplated(template[i]) ) {
            data[i] = mustache.render(template[i], views);
          } else {
            data[i] = template[i];
          }
        }
        return data;

      } else {
        let data = {};
        // Render value of an object
        for (const [key, subtemplate] of Object.entries(template)) {
          if ( Utils.isTemplated(JSON.stringify(subtemplate)) )
            data[key] = Utils.mustacheRender(subtemplate, views);
          else data[key] = subtemplate;
        }
        return data;
      }

    } else if ( Utils.isTemplated(template) ) { // Render simple strings
        return mustache.render(template,views);
    }

    return template;

  }

}

module.exports = Utils;
