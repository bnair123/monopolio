FROM python:latest
LABEL authors="bnair"

# Accept build arguments
ARG FLASK_APP
ARG FLASK_ENV
ARG FLASK_DEBUG
ARG PYTHONPATH

# Set environment variables
ENV FLASK_APP=$FLASK_APP
ENV FLASK_ENV=$FLASK_ENV
ENV FLASK_DEBUG=$FLASK_DEBUG
ENV PYTHONPATH=$PYTHONPATH

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file to the working directory
COPY requirements.txt .

# Install the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Run the Flask app
CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0", "--port=8000"]
