# owntracks-omlox
This Node.js program allows synchronisation between a Owntracks system and the omlox hub. It will share positiondata in both directions.

## Configuration

To configure the system, you can either use command line arguments or you can use environment variables.  



## Command Line Arguments

Command-line-arguments are:  
  `-o`: 'omlox-hostname'  
  `-r`: 'omlox-port'  
  `-n`: 'mqtt-hostname'  
  `-u`: 'mqtt-username'  
  `-p`: 'mqtt-password'  


## Environment Variables



## Docker Installation

When the omlox hub is running in another Container on the same machine, you have to link the docker conntainers together:  
`docker run --name <name> --link <omlox-container-name>:server owntracks-omlox:0.0.1 -- -n <mqttBroker> -u username -p password -o server`