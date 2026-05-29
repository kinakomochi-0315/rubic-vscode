import * as vscode from "vscode";
import * as delay from "delay";
require("promise.prototype.finally").shim();

suite("Catalog tests", function() {

    test("Catalog can be opened by command", function() {
        const ext = vscode.extensions.getExtension("kimushu.rubic");
        return Promise.race<void>([
            ext.activate()
            .then(() => vscode.commands.executeCommand("extension.rubic.showCatalog"))
            .then(() => delay(500)),
            delay.reject(1000, new Error("Timed out"))
        ]);
    });

});
