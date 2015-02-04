/* global module, require, __dirname */
"use strict";

var ChildProcess = require("child_process");
var path = require("path");
var testerProcessPath = path.join(__dirname, "./tester/process");

var Tester = function(config) {
    var childProcess = this._childProcess = ChildProcess.fork(testerProcessPath);
    this._exitProcess = this.exit.bind(this);

    childProcess.send({
        method: "create",
        config: config
    });
};

module.exports = Tester.prototype = {
    create: function(config) {
        return new Tester(config);
    },

    run: function(args, cb) {
        var childProcess = this._childProcess;
        var runMessage = function(response) {
            if (response.method === "run") {
                childProcess.removeListener("message", runMessage);
                cb(response.error);
            }
        };

        childProcess.on("message", runMessage);

        childProcess.send({
            method: "run",
            args: args
        });
    },

    exit: function(cb) {
        var childProcess = this._childProcess;
        var exitMessage = function(response) {
            if (response.method === "exit") {
                childProcess.removeListener("message", exitMessage);
                cb(response.exitCode);
            }
        };

        childProcess.on("message", exitMessage);

        childProcess.send({
            method: "exit"
        });
    }
};
