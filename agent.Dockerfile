FROM node:20-alpine

# Install docker CLI so agent can run docker compose restart
RUN apk add --no-cache docker-cli docker-compose

WORKDIR /app

# Copy only the agent file — no npm install needed (uses only Node built-ins)
COPY agent.js .

EXPOSE 9999

# Run agent — PROJECT_ROOT must point to where docker-compose.yml is
# We mount the project root as /project in docker-compose.yml
CMD ["node", "agent.js"]
