FROM oven/bun:alpine

WORKDIR /app

COPY package.json bun.lock /app/

# RUN apk update && \
#     apk add --no-cache openssh-client git

RUN apk update && apk add --no-cache openssh-client git &&\
    # Clean up apk cache to reduce image size
    rm -rf /var/cache/apk/*
# RUN apk add --update docker openrc
# RUN rc-update add docker boot


RUN bun install 
#--production 

COPY . /app

# RUN bun run dev

EXPOSE 3000

# ... (rest of your Dockerfile) ...


# ENV NODE_ENV=production
# ENV PORT=3000

CMD ["bun", "run", "dev"]