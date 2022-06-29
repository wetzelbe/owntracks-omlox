# :round_pushpin: owntracks-omlox
This Node.js program allows synchronisation between a Owntracks system and the omlox hub. It will share positiondata in both directions.
More information about omlox [here](https://omlox.com/home).

## :wrench: Configuration

To configure the system, you can either use command line arguments or you can use environment variables.  

### :computer: Command Line Arguments

Command-line-arguments are:  
* `-o`: hostname of the omlox hub, standard is localhost  
* `-r`: port of the omlox hub, standard is 8081  
* `-n`: hostname of the MQTT Broker, standard is localhost
* `-q`: port of the MQTT Broker, standard is 1883  
* `-u`: username for authentication, standard is using no authentication  
* `-p`: password for authentication, standard is using no authentication  


### :mount_fuji: Environment Variables
* `OMLOX_HOSTNAME`: see `-o`  
* `OMLOX_PORT`: see `-r`  
* `OMLOX_PATH_PREFIX`: set path that is added in front of API calls to omlox hub
* `MQTT_HOSTNAME`: see `-n`  
* `MQTT_PORT`: see `-q`  
* `MQTT_USERNAME`: see `-u`  
* `MQTT_PASSWORD`: see `-p`  


## Docker Installation
### :construction: Build from Dockerfile
You can build a Docker image using the given Dockerfile:  
>cd owntracks-omlox  
>docker build -t owntracks-omlox:0.0.1 .  

### :rocket: Run the image
When the omlox hub is running in another Container on the same machine, you have to use a network bridge to connect them:  
Create a network:  
>docker network create omlox-network  

Connect the omlox-hub container to the network:  
>docker network connect omlox-network omlox-hub-container-name  

Run the owntracks-omlox container connected to the network:  
>docker run --name name --network omlox-network owntracks-omlox:0.0.1 -- -n mqttBroker -u username -p password -o omlox-hub-host
