FROM node:22-trixie-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-venv \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN python3 -m venv /opt/venv \
  && /opt/venv/bin/pip install --no-cache-dir --upgrade pip \
  && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend ./backend
COPY data ./data
COPY scripts ./scripts
COPY rag ./rag

ENV PATH="/opt/venv/bin:$PATH"
ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/jarvis.db

EXPOSE 3001

WORKDIR /app/backend
CMD ["npm", "start"]
