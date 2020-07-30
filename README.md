# owntracks-omlox
This Node.js program allows synchronisation between a Owntracks system and the omlox hub. It will share positiondata in both directions.

## Command Line Arguments

Command-line-arguments are:  
  `-o`: 'omlox-hostname'  
  `-r`: 'omlox-port'  
      { name: 'mqtt-hostname', alias: 'n', type: String },
    { name: 'mqtt-username', alias: 'u', type: String },
    { name: 'mqtt-password', alias: 'p', type: String }


## Environment Variables



## Docker Installation

When the omlox hub is runninng on localhost, you have to link the docker conntainers together:  
    `docker run --name <name> --link <omlox-container-name>:server owntracks-omlox:0.0.1 -- -n <mqttBroker> -u username -p password -o server`