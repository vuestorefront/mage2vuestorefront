FROM mongo:3.4.3

ADD . /tmp/mongo
# Install selected extensions and other stuff

RUN /usr/bin/mongod --fork --logpath /var/log/mongodb.log \
  && sleep 3 \
  && echo "Creating users... " \
  && mongo rcom /tmp/mongo/setupUsers.js \
  && mongod --shutdown
