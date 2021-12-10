FROM debian:11.2-slim AS altv_js
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN ./docker/altv_js.sh
EXPOSE 7788
ENTRYPOINT /usr/src/app/altv-server


FROM mcr.microsoft.com/dotnet/runtime:6.0.1-bullseye-slim AS altv_cs
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN ./docker/altv_cs.sh
EXPOSE 7788
ENTRYPOINT /usr/src/app/altv-server
