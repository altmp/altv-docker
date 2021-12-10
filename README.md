# altv-docker
Official alt:V docker image

This repository contains Dockerfile for creating alt:V server image based on Debian 11.2 "Bullseye".

## How to use this docker image
Actually, provided Dockerfile creates two images:
* `altv_js` contains NodeJS and npm;
* `altv_cs` contains also C# .NET Core and .NET Core SDK.

All two images could be generated at once by running:
* `docker build .`
or if you need only specific image:
* `docker build --target altv_js -t altv_js .`
* `docker build --target altv_cs -t altv_cs .`

You can find latest alt:V server in `/usr/src/app` directory of the image.

Most probably you want to change configuration, install your resources. You can do it easily by
creating new docker image based on `altv_js` or `altv_cs` image. Example:

    FROM <container>
    WORKDIR /usr/src/app
    RUN sed 's/#password: ultra-password/password: super-ultra-password/' server.cfg
    ENTRYPOINT ["/app/altv-server"]


## Hints on Docker

### Useful docker commands

    # see the alt:V logs
    docker container logs -f <container>

    # inspect inner environment
    docker container inspect <container>

    # interactive bash session
    docker exec -it <container> /bin/bash


### Install Docker On Ubuntu
Most probably you want to run alt:V server image on Linux machine. There is a hint how to setup
docker on Ubuntu 20.04 LTS.

    sudo apt-get update
    sudo apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg-agent \
        software-properties-common

    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
    # check
    sudo apt-key fingerprint 0EBFCD88

    sudo add-apt-repository \
        "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) \
        stable"

    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli docker-compose containerd.io

    sudo docker run hello-world


## Resources
- [Debian docker image](https://hub.docker.com/_/debian)
- [.NET Runtime docker image](https://hub.docker.com/_/microsoft-dotnet-runtime/)
- [Setup alt:V Server on Linux](https://wiki.altv.mp/wiki/Tutorial:Setup_Linux_Server)
- [Install .NET on ubuntu Linux](https://docs.microsoft.com/en-us/dotnet/core/install/linux-debian)
