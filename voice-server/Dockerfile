FROM mcr.microsoft.com/dotnet/sdk:6.0-bullseye-slim-amd64 as base

USER root

RUN apt-get update -y
RUN apt-get install -y libatomic1 libc-bin wget apt-transport-https ca-certificates gnupg
RUN mkdir -p /etc/apt/keyrings
RUN wget -qO- https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_16.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
RUN apt-get update -y
RUN apt-get install nodejs -y
RUN apt autoremove -y
RUN apt-get clean

FROM base as ready

USER root

RUN mkdir /altv
RUN echo '{"loadVoiceServer":true}' > /altv/.altvpkgrc.json
RUN npm i -g altv-pkg@latest

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
