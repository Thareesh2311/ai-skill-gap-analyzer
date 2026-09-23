FROM node:22-bookworm-slim


# =========================================================
# APPLICATION DIRECTORY
# =========================================================

WORKDIR /app


# =========================================================
# SYSTEM DEPENDENCIES
#
# python3:
#   Coding assessment Python execution
#
# openjdk-17-jdk-headless:
#   javac + java for Java assessments
#
# build-essential:
#   Native dependency compilation, including better-sqlite3
# =========================================================

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3 \
        openjdk-17-jdk-headless \
        build-essential \
    && rm -rf /var/lib/apt/lists/*


# =========================================================
# NODE DEPENDENCIES
# =========================================================

COPY package*.json ./


RUN npm ci --omit=dev


# =========================================================
# APPLICATION SOURCE
# =========================================================

COPY . .


# =========================================================
# PRODUCTION ENVIRONMENT
# =========================================================

ENV NODE_ENV=production


# Render's default HTTP port is 10000.
# Your Express app should still read process.env.PORT.
EXPOSE 10000

CMD ["npm", "start"]