"use strict";

const { SerialPortStream } = require("@serialport/stream");
const { autoDetect } = require("@serialport/bindings-cpp");

const Binding = autoDetect();

function normalizePortInfo(port) {
    return Object.assign({}, port, {
        // 旧serialport/canariumはcomNameを参照するため、現行APIのpathから補完する。
        comName: port.comName || port.path,
        path: port.path || port.comName
    });
}

class SerialPort extends SerialPortStream {
    constructor(pathOrOptions, optionsOrCallback, openCallback) {
        let options;
        let callback;

        // serialport v7形式: new SerialPort(path, options, callback)
        if (typeof pathOrOptions === "string") {
            options = Object.assign({}, optionsOrCallback || {}, {
                path: pathOrOptions
            });
            callback = openCallback;
        } else {
            options = Object.assign({}, pathOrOptions || {});
            callback = optionsOrCallback;
        }

        super(Object.assign({ binding: Binding }, options), callback);
    }

    static list(callback) {
        const promise = Binding.list().then((ports) => ports.map(normalizePortInfo));
        if (callback != null) {
            promise.then((ports) => callback(null, ports), (error) => callback(error));
        }
        return promise;
    }
}

SerialPort.binding = Binding;
SerialPort.parsers = {};

module.exports = SerialPort;
module.exports.SerialPort = SerialPort;
module.exports.default = SerialPort;
module.exports.list = SerialPort.list.bind(SerialPort);
