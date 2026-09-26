#!/bin/bash
echo "Starting app..."
uvicorn api:app --host 0.0.0.0 --port 10000 > app_output.log 2>&1
# If uvicorn crashes, we start a simple python server to show the error log on port 10000
echo "Uvicorn crashed. Serving error log on port 10000..."
python -m http.server 10000
