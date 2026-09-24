FROM node:22-alpine
WORKDIR /app
COPY package.json cli.mjs preview-server.mjs ./
COPY lib ./lib
COPY llm ./llm
COPY public ./public
COPY styles ./styles
RUN chmod +x cli.mjs preview-server.mjs \
  && addgroup -g 1001 -S app \
  && adduser -S app -u 1001 -G app \
  && chown -R app:app /app
USER app
ENV AICOM_LANDING_HOST=0.0.0.0
ENV AICOM_LANDING_PORT=3847
EXPOSE 3847
ENTRYPOINT ["node", "/app/preview-server.mjs"]
