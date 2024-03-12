FROM node:lts

# download and start subconverter service (port:25500)
RUN apt-get update && apt-get install -y wget \
    && wget https://github.com/tindy2013/subconverter/releases/download/v0.8.1/subconverter_linux64.tar.gz -O ~/subconverter.tar.gz \
    && tar -zxvf ~/subconverter.tar.gz \
    && chmod +x ~/subconverter/subconverter

# Copy files
COPY . ./

# Install dependencies
RUN npm ci

CMD ["sh", "-c", "echo 'Starting required services...' && ~/subconverter/subconverter >./subconverter.log 2>&1 &"]

# Run `node /index.js`
ENTRYPOINT ["node", "/index.js"]
