FROM node:lts
# workdir
WORKDIR /github/workspace

# Copy files
COPY . /github/workspace

# install dependencies
RUN npm ci

# download and start subconverter service (port:25500)
RUN apt-get update && apt-get install -y wget \
    && wget https://github.com/tindy2013/subconverter/releases/download/v0.8.1/subconverter_linux64.tar.gz -O ./subconverter.tar.gz \
    && tar -zxvf ./subconverter.tar.gz \
    && chmod +x ./subconverter/subconverter

CMD ["./subconverter/subconverter"]

# run `node /index.js`
ENTRYPOINT ["node", "./index.js"]
