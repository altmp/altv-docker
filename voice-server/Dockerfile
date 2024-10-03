FROM node:20.11.0-bookworm-slim as base

USER root

RUN apt-get update -y
RUN apt-get install -y libatomic1 curl libc-bin wget apt-transport-https ca-certificates gnupg
RUN apt autoremove -y
RUN apt-get clean

FROM base as ready

USER root

RUN mkdir /altv
RUN echo '{"loadVoiceServer":true}' > /altv/.altvpkgrc.json
RUN npm i -g altv-pkg@^2.10.0

ADD ./config /root/setup
RUN cd /root/setup && npm i
RUN cd /root/setup && rm server.js package-lock.json

COPY ./voice-server/entrypoint.sh /root/
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
RUN rm -rf altv-server data modules libnode*
RUN chmod +x /altv/altv-voice-server
RUN chmod +x /altv/altv-crash-handler

ENTRYPOINT [ "/root/entrypoint.sh" ]
