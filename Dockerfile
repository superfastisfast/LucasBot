FROM oven/bun:alpine

WORKDIR /app

COPY package.json bun.lock /app/

RUN apk update && \
    apk add --no-cache openssh-client git

RUN mkdir -p -m 0600 ~/.ssh && \
    ssh-keyscan -H github.com >> ~/.ssh/known_hosts 


RUN bun install --production 

COPY . /app



RUN bun run dev

EXPOSE 3000

# ENV NODE_ENV=production
# ENV PORT=3000

CMD ["bun", "run", "start"]