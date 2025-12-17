FROM svhd/logto:latest

# Entrypoint script that seeds DB on first run, then starts the app
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
