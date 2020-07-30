# owntracks-omlox
This Node.js program allows synchronisation between a Owntracks system and the omlox hub. It will share positiondata in both directions.

## Command Line Arguments


## Environment Variables

## Docker Installation

´docker run --name owntracks_omlox_local --link vigorous_wing:server owntracks-omlox:0.0.1 -- -n 192.168.0.164 -u benedict -p mosquitto -o server´