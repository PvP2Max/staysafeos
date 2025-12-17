FROM svhd/logto:latest

# Copy and setup entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Override the default entrypoint to run our init script
ENTRYPOINT ["/bin/bash", "/entrypoint.sh"]
