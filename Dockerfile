#install nodejs
#FROM node:10
FROM ubuntu:20.04
RUN apt-get update
RUN apt-get install -y software-properties-common
RUN add-apt-repository ppa:libreoffice/ppa
RUN apt-get update
RUN apt-get install -y --force-yes libreoffice
RUN apt-get clean

RUN apt-get install -y nodejs npm
RUN apt-get install -y pdftk
RUN apt-get install -y poppler-utils
RUN apt-get install -y tesseract-ocr
RUN apt-get install -y ghostscript

RUN mkdir -p /edokyu
RUN mkdir -p /drive

WORKDIR /edokyu
COPY package.json /edokyu
RUN npm install
COPY . /edokyu
EXPOSE 80
EXPOSE 443

#RUN chmod ugo+x data/restoredb.sh
#RUN data/restoredb.sh

CMD ["node", "index.js"]


