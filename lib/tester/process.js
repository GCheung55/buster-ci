/* global require, process */
"use strict";

var busterTestCli = require("buster-test-cli");
var frameworkExtension = require("buster/lib/buster/framework-extension");
var wiringExtension = require("buster/lib/buster/wiring-extension");
var syntax = require("buster-syntax").create({
    ignoreReferenceErrors: true
});
var fs = require("fs");

process.on("message", function(request){
    if (request.method === "create") {
        var config = request.config || {};
        var outputStream = config.outputFile ? fs.createWriteStream(config.outputFile) : process.stdout;

        var testCli = busterTestCli.create(outputStream, process.stderr, {
            missionStatement: "Run Buster.JS tests on node, in browsers, or both",
            description: "",
            environmentVariable: "BUSTER_TEST_OPT",
            runners: busterTestCli.runners,
            configBaseName: "buster",
            extensions: {
                browser: [
                    frameworkExtension,
                    wiringExtension,
                    syntax
                ]
            }
        });

        var origExit = testCli.exit;
        var exitCode = 1;
        var newExit = function(code, cb) {
            exitCode = code;
            cb(code);
        };

        testCli.exit = newExit;

        process.on("message", function(request){
            if (request.method === "run") {
                var args = request.args || [];
                testCli.run(args, function(err){
                    process.send({
                        method: "run",
                        error: err
                    });
                });
            } else if (request.method === "exit") {
                origExit.call(testCli, exitCode, function(exitCode){
                    process.send({
                        method: "exit",
                        exitCode: exitCode
                    });
                });
            }
        });
    }
});
