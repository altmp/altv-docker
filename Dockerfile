FROM node:20-bullseye as base

USER root

RUN apt-get update -y
RUN apt-get install -y libatomic1 libc-bin wget apt-transport-https ca-certificates
RUN apt autoremove -y
RUN apt-get clean

RUN wget https://dot.net/v1/dotnet-install.sh
RUN chmod +x dotnet-install.sh
RUN ./dotnet-install.sh -c 6.0
ENV PATH="${PATH}:/root/.dotnet/"

RUN dotnet --version

FROM base as ready

USER root

RUN mkdir /opt/altv
RUN echo '{"loadBytecodeModule":true,"loadCSharpModule":true}' > /opt/altv/.altvpkgrc.json
RUN npm i -g altv-pkg@latest

ADD config /root/setup
COPY ./entrypoint.sh /root/
RUN chmod +x /root/entrypoint.sh

FROM ready

USER root
ARG BRANCH=release
ENV ALTV_BRANCH=$BRANCH 

RUN cd /opt/altv && npx altv-pkg ${BRANCH}
RUN chmod +x /opt/altv/altv-server

WORKDIR /opt/altv/

EXPOSE 7788/udp
EXPOSE 7788/tcp

ENTRYPOINT [ "/root/entrypoint.sh" ]
