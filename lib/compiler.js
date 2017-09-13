'use strict';

var R = require('ramda');
var tree = require('treehugger-node/tree');
var SHADOW_PATTERN = /\$\{[^{}]*\}/g;

var mapKey = R.curry(function (fn, obj) {
  return R.reduce(function (result, item) {
    var key = R.head(item);
    var value = R.last(item);
    result[fn(key)] = value;
    return result;
  }, {}, R.toPairs(obj));
});

// 将对象进行预着色
var _shadow = R.curry(function (originObj, debug) {
  debug = debug || false;
  // path: value
  // example: {'a.b.c': '0'}

  var lastType = R.compose(R.type, R.last);

  if (debug) {
    console.log('prepro shadow: ', originObj);
  }
  if (!originObj) {
    return {};
  }

  return R.compose(R.filter(R.identity), R.map(R.cond([[R.compose(R.equals('Object'), lastType), R.converge(R.pair, [R.head, R.compose(_shadow(R.__, debug), R.last)])], [R.compose(R.test(SHADOW_PATTERN), R.last), R.identity], [R.T, R.always(null)]])), R.toPairs)(originObj) || [];
});

// 先决条件为对对象进行预着色
var shadow = R.curry(function (preproshadow, debug) {
  debug = debug || false;
  if (debug) {
    console.log('shadow: ', preproshadow);
  }

  return R.reduce(function (result, item) {
    var path = R.head(item);
    var value = R.last(item);

    if (Array.isArray(value)) {
      // shadow(value)
      result = R.merge(result, R.compose(mapKey(function (key) {
        return R.join('.', [path, key]);
      }), shadow(R.__, debug))(value));
    } else {
      result[path] = value;
    }

    return result;
  }, {})(preproshadow);
});

var buildGrammarTree = function buildGrammarTree(shadow) {
  // shadow: "${counter()} world"
  return R.map(function (value) {
    return value.match(SHADOW_PATTERN).map(function (model) {
      var str = model.slice(2, -1);
      return {
        shadow: shadow,
        model: model,
        oripattern: value,
        pattern: str,
        node: tree.parse(str)
      };
    });
  }, shadow);
};

var debugCompile = R.compose(buildGrammarTree, shadow(R.__, true), _shadow(R.__, true));
var compile = R.compose(buildGrammarTree, shadow(R.__, false), _shadow(R.__, false));

module.exports = {
  compile: compile,
  debugCompile: debugCompile,
  shadow: shadow,
  _shadow: _shadow,
  buildGrammarTree: buildGrammarTree
};