'use strict';

var bridges = require('./bridges.js');

function bridge_addr(config) {
  var parts = config.split(':');
  if (parts.length == 2) {
    return {
      protocol: parts[0].toLowerCase(),
      addr: parts[1]
    };
  } else {
    return undefined;
  }
}

function bridge_type(source_protocol, target_protocol) {
  return source_protocol + "_to_" + target_protocol;
}

function bridge_config(config) {
  var parts = config.split('=>');
  if (parts.length == 2) {
    var source = bridge_addr(parts[0]);
    var target = bridge_addr(parts[1]);
    if (source === undefined || target === undefined) {
      return undefined;
    } else {
      return {
        type: bridge_type(source.protocol, target.protocol),
        source: source.addr,
        target: target.addr
      };
    }
  } else {
    return undefined;
  }
}

function Proxy(config, bridgehost, ioFogOptions) {
  console.log("Proxying %s", config);
  var bridgeconfig = bridge_config(config);

  if (bridgeconfig) {
    switch (bridgeconfig.type) {
      case "amqp_to_http":
        return bridges.amqp_to_http(bridgeconfig.source, bridgehost, bridgeconfig.target, ioFogOptions);
      case "amqp_to_http2":
        return bridges.amqp_to_http2(bridgeconfig.source, bridgehost, bridgeconfig.target);
      case "amqp_to_tcp":
        return bridges.amqp_to_tcp(bridgeconfig.source, bridgehost, bridgeconfig.target, ioFogOptions);
      case "http_to_amqp":
        return bridges.http_to_amqp(bridgeconfig.source, bridgeconfig.target, ioFogOptions);
      case "http2_to_amqp":
        return bridges.http2_to_amqp(bridgeconfig.source, bridgeconfig.target);
      case "tcp_to_amqp":
        return bridges.tcp_to_amqp(bridgeconfig.source, bridgeconfig.target, ioFogOptions);
    }
  }

  console.error("Unrecognised bridge type: %s", bridgeconfig.type);
}

module.exports.proxy = function (config, bridgehost, ioFogOptions) {
  return new Proxy(config, bridgehost, ioFogOptions)
}
