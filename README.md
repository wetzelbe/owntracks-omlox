# owntracks-omlox
This Node.js program allows synchronisation between a Owntracks system and the omlox hub. It will share positiondata in both directions.

## Command Line Arguments


## Environment Variables

## Docker Installation

    docker run --name <name> --link <omlox-container-name>:server owntracks-omlox:0.0.1 -- -n <mqttBroker> -u username -p password -o server