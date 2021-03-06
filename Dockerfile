FROM registry.access.redhat.com/ubi8/nodejs-10

RUN mkdir -p /opt/app-root/
WORKDIR /opt/app-root/

ADD package.json /opt/app-root/
RUN npm install
COPY bin bin
COPY lib lib
COPY LICENSE LICENSE

CMD ["node", "/opt/app-root/bin/icproxy.js"]
