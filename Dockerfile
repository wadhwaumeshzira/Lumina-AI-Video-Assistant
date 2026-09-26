FROM python:3.10-slim

# Install system dependencies (ffmpeg is required for pydub to process audio)
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY Requirements.txt .
RUN pip install --no-cache-dir -r Requirements.txt

# Copy the rest of the application
COPY . .

# Expose the port
EXPOSE 8000

# Copy start script
COPY start.sh .
RUN apt-get update && apt-get install -y dos2unix && dos2unix start.sh && chmod +x start.sh

# Run the startup script
CMD ["./start.sh"]
