# owntracks-omlox
This Node.js program allows synchronisation between a Owntracks system and the omlox hub. It will share positiondata in both directions.

## Configuration

To configure the system, you can either use command line arguments or you can use environment variables.  



## Command Line Arguments

Command-line-arguments are:  
* `-o`: hostname of the omlox hub, standard is localhost  
* `-r`: port of the omlox hub, standard is 8081  
* `-n`: hostname of the MQTT Broker, standard is localhost, port 1883 is used  
* `-u`: username for authentication, standard is using no authentication  
* `-p`: password for authentication, standard is using no authentication (password and username have to be given together, otherwise the authentication will fail)  


## Environment Variables
* `OMLOX_HOSTNAME`: see `-o`  
* `OMLOX_PORT`: see `-r`  
* `MQTT_HOSTNAME`: see `-n`  
* `MQTT_USERNAME`: see `-u`  
* `MQTT_PASSWORD`: see `-p`  


## Docker Installation

When the omlox hub is running in another Container on the same machine, you have to link the docker containers together:  
>docker run --name name --link omlox-container-name:server owntracks-omlox:0.0.1 -- -n mqttBroker -u username -p password -o server