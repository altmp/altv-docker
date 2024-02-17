ARG MODULES="js"

FROM node:20.11.0-bookworm-slim as base-js

USER root

RUN apt-get update -y
RUN apt-get install -y curl libatomic1 libc-bin wget apt-transport-https ca-certificates gnupg
RUN apt autoremove -y
RUN apt-get clean

RUN mkdir /altv
RUN echo '{"loadBytecodeModule":true}' > /altv/.altvpkgrc.json

FROM base-js as ready

USER root

RUN npm i -g altv-pkg@latest

ADD ./config /root/setup
RUN cd /root/setup && npm i
RUN cd /root/setup && rm voice-server.js package-lock.json

COPY ./server/entrypoint.sh /root/
RUN chmod +x /root/entrypoint.sh

FROM ready as downloaded

USER root
ARG BRANCH=release
ARG MODULES="js"
ENV ALTV_BRANCH=$BRANCH 
ENV ALTV_MODULE_TYPE=$MODULES

WORKDIR /altv/

EXPOSE 7788/udp
EXPOSE 7788/tcp

ARG CACHEBUST=1

RUN cd /altv && npx altv-pkg ${BRANCH}
RUN chmod +x /altv/altv-server
RUN chmod +x /altv/altv-crash-handler

ENTRYPOINT [ "/root/entrypoint.sh" ]
