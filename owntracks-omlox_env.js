// Connects to a MQTT Broker, subscribes to all owntracks-messages and pushes all locations to the omlox hub.
// It also connects to Omlox via a websocket and pushes all location updates, except for those which came from owntracks, to owntracks
// Usage is node connectToOwntracksMQTTtwoWays.js
//
var mqtt = require('mqtt')
var http = require('http')
var mqttBroker = 'mqtt:localhost'  // MQTT Broker to connect to
var omloxhostname = 'localhost'
var omloxport = 8081
var noauth = true
var username
var password

try {
    console.log({ OMLOX_HOSTNAME: process.env.OMLOX_HOSTNAME,
                OMLOX_PORT: process.env.OMLOX_PORT,
                MQTT_HOSTNAME:process.env.MQTT_HOSTNAME,
                MQTT_USERNAME:process.env.MQTT_USERNAME,
                MQTT_PASSWORD:process.env.MQTT_PASSWORD})
    if (process.env.OMLOX_HOSTNAME != undefined) {
        omloxhostname = process.env.OMLOX_HOSTNAME
    }
    if (process.env.OMLOX_PORT != undefined) {
        omloxport = process.env.OMLOX_PORT
    }
    if (process.env.MQTT_HOSTNAME != undefined) {
        mqttBroker = process.env.MQTT_HOSTNAME
    }
    if (process.env.MQTT_USERNAME != undefined && process.env.MQTT_PASSWORD != undefined) {
        noauth = false
        username = process.env.MQTT_USERNAME
        password = process.env.MQTT_PASSWORD
    }
} catch (error) {
    console.log("Failed reading environment variables, continuing with standard values!")
    console.log()
    process.exit()
}




var mqttclient
console.log(noauth)
if (noauth) {
    console.log('in noauth = true')
    mqttclient = mqtt.connect({
        host: mqttBroker,
        port: 1883
    })
}
else {
    mqttclient = mqtt.connect({
        host: mqttBroker,
        port: 1883,
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
    console.log("Connected to " + mqttBroker)
    mqttclient.subscribe('owntracks/#', function (err) {
        console.log(err)
    })
})


mqttclient.on('message', function (topic, message) {            // gets Locations from Owntracks
    // message is Buffer
    console.log(topic)
    console.log(JSON.parse(message))
    var owntracksLocation = JSON.parse(message)
    var topicSplit = topic.split("/")
    topicSplit.forEach(element => {
        //console.log(element)
    })
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
            console.log('statusCode: %d', res.statusCode)
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
    console.log('Connect Error: ' + error.toString())
})

wsclient.on('connect', function (connection) {          // Gets Locations from Omlox
    connection.send(JSON.stringify({
        event: 'subscribe',
        topic: 'location_updates'
    }))
    console.log('WebSocket Client Connected');
    connection.on('error', function (error) {
        console.log("Connection Error: " + error.toString());
    })
    connection.on('close', function () {
        console.log('Connection Closed');
    })
    connection.on('message', function (message) {
        if (JSON.parse(message.utf8Data).event == 'subscribed') {
            console.log('Subscribed')
        }
        else if (JSON.parse(message.utf8Data).event == 'message') {
            JSON.parse(message.utf8Data).payload.forEach(location => {
                if (location.source != "owntracks") {
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
wsclient.connect('ws://localhost:8081/v1/ws/socket')        // Websocket connects to Omlox