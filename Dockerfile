FROM node:12

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
# COPY package*.json ./

COPY . /usr/src/app


WORKDIR /usr/src/app/frontend

RUN npm install
RUN npm run build


WORKDIR /usr/src/app/backend

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production


EXPOSE 80
CMD [ "node", "app.js" ]