'use strict';

var R = require('ramda');

var _require = require('./compiler'),
    compile = _require.compile,
    debugCompile = _require.debugCompile;

/**
*
* @param {Object} inject a symbol table
* @param {bool} default is false
* @returns {Function} renderTemplate
*/


function renderer(inject) {
  var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  return function (obj) {
    if (debug) {
      console.log('renderer: ', obj);
    }
    var _compile = debug ? debugCompile : compile;
    var answer = R.map(function (renderArray) {
      return R.reduce(function (oripattern, item) {
        if (typeof item.pattern === 'string') {
          return oripattern.replace(item.model, inject[item.pattern.trim()]);
        } else {
          return oripattern.replace(item.model, item.pattern);
        }
      }, R.head(renderArray).oripattern, renderArray);
    }, _compile(obj));

    return R.reduce(function (result, pair) {
      var path = R.split('.', R.head(pair));
      var value = R.last(pair);
      return R.assocPath(path, value, result);
    }, obj, R.toPairs(answer));
  };
}

module.exports = renderer;