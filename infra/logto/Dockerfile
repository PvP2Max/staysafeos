FROM ghcr.io/logto-io/logto:latest

# Cache bust - change this value to force rebuild
ARG CACHE_BUST=v2

# Copy init script
COPY init.sh /init.sh
RUN chmod +x /init.sh

# Use our init script as entrypoint
ENTRYPOINT ["/init.sh"]
