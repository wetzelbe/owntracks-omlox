// Connects to a MQTT Broker, subscribes to all owntracks-messages and pushes all locations to the omlox hub.
// It also connects to Omlox via a websocket and pushes all location updates, except for those which came from owntracks, to owntracks
// Usage is node owntracks-omlox.js
//
var mqtt = require('mqtt')
var http = require('http')
var commandLineArgs = require('command-line-args')
var mqttBroker = 'localhost'  // MQTT Broker to connect to
var mqttPort = 1883
var omloxhostname = 'localhost'
var omloxport = 8081
var noauth = true
var username
var password

const optionDefinitions = [
    { name: 'omlox-hostname', alias: 'o', type: String },
    { name: 'omlox-port', alias: 'r', type: String },
    { name: 'mqtt-hostname', alias: 'n', type: String },
    { name: 'mqtt-username', alias: 'u', type: String },
    { name: 'mqtt-password', alias: 'p', type: String },
    { name: 'mqtt-port', alias: 'q', type: String }
]

function printOptions(optionsToPrint) {
    optionsToPrint.forEach(option => {
        console.log("-" + option.alias + "  " + option.name)
    })
}


try {
    console.log('[PROGRAM]: environment variables are: ')
    console.log({ OMLOX_HOSTNAME: process.env.OMLOX_HOSTNAME,
                OMLOX_PORT: process.env.OMLOX_PORT,
                MQTT_HOSTNAME:process.env.MQTT_HOSTNAME,
                MQTT_USERNAME:process.env.MQTT_USERNAME,
                MQTT_PASSWORD:process.env.MQTT_PASSWORD,
                MQTT_PORT: process.env.MQTT_PORT})
    if (process.env.OMLOX_HOSTNAME != undefined) {
        omloxhostname = process.env.OMLOX_HOSTNAME
    }
    if (process.env.OMLOX_PORT != undefined) {
        omloxport = process.env.OMLOX_PORT
    }
    if (process.env.MQTT_HOSTNAME != undefined) {
        mqttBroker = process.env.MQTT_HOSTNAME
    }
    if (process.env.MQTT_PORT != undefined) {
        mqttPort = process.env.MQTT_PORT
    }
    if (process.env.MQTT_USERNAME != undefined && process.env.MQTT_PASSWORD != undefined) {
        noauth = false
        username = process.env.MQTT_USERNAME
        password = process.env.MQTT_PASSWORD
    }
} catch (error) {
    console.log("Failed reading environment variables, exiting!")
    console.log()
    process.exit()
}


var options
try {
    options = commandLineArgs(optionDefinitions)
    console.log('[PROGRAM]: Given command line args are: ');
    console.log(options)
    if (options.hasOwnProperty('omlox-hostname')) {
        omloxhostname = options['omlox-hostname']
    }
    if (options.hasOwnProperty('omlox-port')) {
        omloxport = options['omlox-port']
    }
    if (options.hasOwnProperty('mqtt-hostname')) {
        mqttBroker = options['mqtt-hostname']
    }
    if (options.hasOwnProperty('mqtt-port')) {
        mqttPort = options['mqtt-port']
    }
    if (options.hasOwnProperty('mqtt-username') && options.hasOwnProperty('mqtt-password')) {
        noauth = false
        username = options['mqtt-username']
        password = options['mqtt-password']
    }
} catch (error) {
    console.log("Parsing options failed, options are:")
    printOptions(optionDefinitions)
    console.log()
    process.exit()
}
var mqttclient
if (noauth) {
    mqttclient = mqtt.connect({
        host: mqttBroker,
        port: mqttPort
    })
}
else {
    mqttclient = mqtt.connect({
        host: mqttBroker,
        port: mqttPort,
        username: username,
        password: password
    })
}
var WebSocketClient = require('websocket').client
var wsclient = new WebSocketClient()
function buildHTTPReq(method, path) {
    if (method == 'GET') {
        return {
            hostname: omloxhostname,
            port: omloxport,
            path: path,
            method: method,
        }
    }
    else {
        return {
            hostname: omloxhostname,
            port: omloxport,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': 0
            }
        }
    }
}

mqttclient.on('connect', function () {
    console.log("[OWNTRACKS]: Connected to " + mqttBroker)
    mqttclient.subscribe('owntracks/#', function (err) {
        if (err != null)
            console.log(err)
    })
})


mqttclient.on('message', function (topic, message) {            // gets Locations from Owntracks
    // message is Buffer
    console.log('[OWNTRACKS]: ' + topic)
    console.log(JSON.parse(message))
    var owntracksLocation = JSON.parse(message)
    var topicSplit = topic.split("/")
    var username = topicSplit[1]
    var device = topicSplit[2]
    if (owntracksLocation._type == "location" && username != "omlox") {

        var currentDate = new Date()
        var omloxLocation = {
            crs: "EPSG:4326",
            position: {
                type: "Point",
                coordinates: [
                    owntracksLocation.lon,
                    owntracksLocation.lat
                ]
            },
            source: "owntracks",
            provider_type: "gps",
            provider_id: owntracksLocation.tid,
            timestamp_generated: new Date(owntracksLocation.tst * 1000).toISOString(),
            timestamp_sent: currentDate.toISOString()
        }
        if (owntracksLocation.hasOwnProperty('acc')) {
            omloxLocation.accuracy = owntracksLocation.acc
        }
        if (owntracksLocation.hasOwnProperty('alt')) {
            omloxLocation.position.coordinates[2] = owntracksLocation.alt
        }
        console.log(omloxLocation)
        var updateLocation = buildHTTPReq('PUT', ('/v1/providers/' + owntracksLocation.tid + '/location'))
        updateLocation.headers['Content-Length'] = JSON.stringify(omloxLocation).length
        const loc = http.request(updateLocation, res => {
            console.log('[OMLOX]: statusCode: %d', res.statusCode)
            var locdata = ''
            res.on('data', d => {
                locdata = locdata + d
            })
            res.on('end', () => {
                if (locdata != "") {
                    console.log(JSON.parse(locdata))
                }
            })
        })
        loc.write(JSON.stringify(omloxLocation))
        loc.end()

    }
})

wsclient.on('connectFailed', function (error) {
    console.log('[WebSocket]: Connect Error: ' + error.toString())
})

wsclient.on('connect', function (connection) {          // Gets Locations from Omlox
    connection.send(JSON.stringify({
        event: 'subscribe',
        topic: 'location_updates'
    }))
    console.log('[WebSocket]: WebSocket Client Connected');
    connection.on('error', function (error) {
        console.log("[WebSocket]: Connection Error: " + error.toString());
    })
    connection.on('close', function () {
        console.log('[WebSocket]: Connection Closed');
    })
    connection.on('message', function (message) {
        if (JSON.parse(message.utf8Data).event == 'subscribed') {
            console.log('[WebSocket]: Subscribed')
        }
        else if (JSON.parse(message.utf8Data).event == 'message') {
            JSON.parse(message.utf8Data).payload.forEach(location => {
                if (location.source != "owntracks") {
                    connsole.log("[WebSocket]: Received Location from omlox")
                    console.log(location)
                    var omloxLocation = {
                        _type: "location",
                        lon: location.position.coordinates[0],
                        lat: location.position.coordinates[1],
                        tid: location.provider_id,
                        tst: Math.floor(new Date() / 1000)
                    }
                    if (location.hasOwnProperty('course')) {
                        omloxLocation.cog = location.course
                    }
                    mqttclient.publish("owntracks/omlox/" + location.source + "." + location.provider_id, JSON.stringify(omloxLocation))
                }
            });
        }
    })
})
wsclient.connect('ws://' + omloxhostname + ':' + omloxport + '/v1/ws/socket')        // Websocket connects to Omlox
