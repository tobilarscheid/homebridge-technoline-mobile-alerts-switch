var request = require("request");
var http = require('http');
var url = require('url');

var Accessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {
    // Accessory must be created from PlatformAccessory Constructor
    Accessory = homebridge.platformAccessory;

    // Service and Characteristic are from hap-nodejs
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    // For platform plugin to be considered as dynamic platform plugin,
    // registerPlatform(pluginName, platformName, constructor, dynamic), dynamic must be true
    homebridge.registerPlatform("homebridge-ma10880-mobile-alerts-switch", "ma10880-switch-platform", Platform);
    homebridge.registerAccessory("homebridge-ma10880-mobile-alerts-switch", "ma10880-switch", Switch);
}

// Platform constructor
// config may be null
// api may be null if launched from old homebridge version
function Platform(log, config) {
    this.log = log;
    this.config = config;
}

Platform.prototype = {
    accessories: function (callback) {
        this.accessories = new Map();
        var allButtons = []
        this.config['panels'].forEach(panel => {
            var buttonsOnPanel = []

            if (!panel['buttons']) {
                panel['buttons'] = ""
            }

            buttonsOnPanel.push(new Switch(this.log, panel['name'] + '-' + (panel['buttons'][0] || 1)));
            buttonsOnPanel.push(new Switch(this.log, panel['name'] + '-' + (panel['buttons'][1] || 2)));
            buttonsOnPanel.push(new Switch(this.log, panel['name'] + '-' + (panel['buttons'][2] || 3)));
            buttonsOnPanel.push(new Switch(this.log, panel['name'] + '-' + (panel['buttons'][3] || 4)));

            this.accessories[panel.id.toLowerCase()] = buttonsOnPanel

            allButtons.push(...buttonsOnPanel)
        });

        callback(allButtons);
        var platform = this;
        http.createServer(function (request, response) {
            var body = [];
            request.on('error', (function (err) {
                platform.log("[ERROR ma10880-switch-platform Server] Reason: %s.", err);
            }).bind(this)).on('data', function (chunk) {
                body.push(chunk);
            }).on('end', (function () {
                var buffer = Buffer.concat(body);
                //the gateway sometimes queues the button presses and sends multiple in one request, each being 64 bytes long
                for (i = 0, j = buffer.length; i < j; i += 64) {
                    platform.processMessage(buffer.slice(i, i + 64))
                }
                response.end();
            }))
        }).listen(this.config['port'] || 8000, "0.0.0.0");
    }
}

Platform.prototype.processMessage = function (message) {
    var deviceId = message.slice(6, 12).toString('hex').toLowerCase()
    var device = this.accessories[deviceId]
    if (!device) {
        this.log.warn('Received button press for unknown device ' + deviceId)
        response.end();
        return;
    }
    var buttonAndAction = message[14].toString(16);
    device[buttonAndAction.substr(0, 1) - 1].pushed(buttonAndAction.substr(1, 1));
}

function Switch(log, name) {
    this.log = log;
    this.name = name
    this.service = [];
    this.service.push(new Service.StatelessProgrammableSwitch(this.name));
    this.ignoreNextMessage = false; //every click event triggers two http messages, ignore every second

    this.pushed = (function (type) {
        if (!this.ignoreNextMessage) {
            this.service[0].getCharacteristic(Characteristic.ProgrammableSwitchEvent).updateValue(type - 1, undefined, "empty");
        }
        this.ignoreNextMessage = !this.ignoreNextMessage;
    })
}

Switch.prototype.getServices = function () {
    return this.service;
};