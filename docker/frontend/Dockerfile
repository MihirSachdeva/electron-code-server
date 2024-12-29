FROM ubuntu:22.04

# Install necessary packages (curl, build-essential, shells, etc.)
RUN apt-get update && \
    apt-get install -y curl wget git build-essential nano sudo

# Install code-server (v5.x is typical, adapt as needed)
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Install node and npm
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Create a user for the container (non-root)
RUN useradd -ms /bin/bash contest

# Create a new user named contest
USER contest

# Set the working directory to /home/contest
WORKDIR /home/contest

# Setup a git user, random name and email
RUN git config --global user.name "Code Server User"
RUN git config --global user.email "code-server-user@example.com"

# Whitelist github.com for ssh
RUN mkdir -p /home/contest/.ssh
RUN touch /home/contest/.ssh/known_hosts
RUN ssh-keyscan github.com >> /home/contest/.ssh/known_hosts

# Expose port for code-server to run later
EXPOSE 8080

# When the container starts, run code-server in the contest folder
CMD ["code-server", "/home/contest", "--bind-addr", "0.0.0.0:8080", "--auth", "none", "--disable-telemetry", "--user-data-dir", "/home/contest/.local/share/code-server"]
