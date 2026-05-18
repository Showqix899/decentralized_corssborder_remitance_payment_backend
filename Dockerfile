#base image
FROM node:20-alpine

#create app directory
WORKDIR /app


#copy package.json and package-lock.json
COPY package*.json ./

#Install dependencies
RUN npm install 

#copy source code
COPY . .

#expose port
EXPOSE 3000

#DEFAULT COMMAND
CMD ["npm","run","dev"]

