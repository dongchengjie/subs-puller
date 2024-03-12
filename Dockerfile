FROM node:lts

# download and start subconverter service (port:25500)
RUN apt-get update && apt-get install -y wget \
    && wget https://github.com/tindy2013/subconverter/releases/download/v0.8.1/subconverter_linux64.tar.gz -O /subconverter.tar.gz \
    && tar -zxvf /subconverter.tar.gz > /dev/null \
    && chmod +x /subconverter/subconverter

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of your action's code
COPY . .

# Run
ENTRYPOINT ["sh", "-c", "/subconverter/subconverter >./subconverter.log 2>&1 & node /index.js"]