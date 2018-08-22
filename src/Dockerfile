FROM node:8-alpine

# create directory on image where code will be located
RUN mkdir -p /var/www

# set directory to be location where commands will be run from
WORKDIR /var/www

# copy all app codes to work directory
COPY . .

RUN yarn install --production=false --no-cache

# expose port 8080 for app
EXPOSE 8080

COPY mage2vsf.sh /usr/local/bin/

# start app
ENTRYPOINT ["mage2vsf.sh"]
