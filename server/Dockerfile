FROM mcr.microsoft.com/dotnet/sdk:6.0-bullseye-slim-amd64 as base

USER root

RUN apt-get update -y
RUN apt-get install -y libatomic1 libc-bin wget apt-transport-https ca-certificates
RUN wget -qO- https://deb.nodesource.com/setup_16.x | bash - && apt-get install -y nodejs
RUN apt autoremove -y
RUN apt-get clean

FROM base as ready

USER root

RUN mkdir /altv
RUN echo '{"loadBytecodeModule":true,"loadCSharpModule":true}' > /altv/.altvpkgrc.json
RUN npm i -g altv-pkg@latest

ADD ./config /root/setup
RUN cd /root/setup && npm i
RUN cd /root/setup && rm voice-server.js package-lock.json

COPY ./server/entrypoint.sh /root/
RUN chmod +x /root/entrypoint.sh

FROM ready as downloaded

USER root
ARG BRANCH=release
ENV ALTV_BRANCH=$BRANCH 

WORKDIR /altv/

EXPOSE 7788/udp
EXPOSE 7788/tcp

ARG CACHEBUST=1

RUN cd /altv && npx altv-pkg ${BRANCH}
RUN chmod +x /altv/altv-server
RUN chmod +x /altv/altv-crash-handler

ENTRYPOINT [ "/root/entrypoint.sh" ]
