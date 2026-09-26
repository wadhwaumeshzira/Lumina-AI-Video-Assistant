#!/bin/bash
echo "Starting FastAPI on port 10000..."
uvicorn api:app --host 0.0.0.0 --port 10000
