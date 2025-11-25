FROM ubuntu:24.04
RUN apt-get update && apt-get install -y bash curl docker-cli ca-certificates gnupg
USER root
RUN curl -fsSL https://raw.githubusercontent.com/drasi-project/drasi-platform/main/cli/installers/install-drasi-cli.sh | /bin/bash 

RUN curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.31/deb/Release.key | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
RUN chmod 644 /etc/apt/keyrings/kubernetes-apt-keyring.gpg
RUN echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.31/deb/ /' | tee /etc/apt/sources.list.d/kubernetes.list
RUN chmod 644 /etc/apt/sources.list.d/kubernetes.list
RUN apt-get update && apt-get install -y kubectl

RUN apt-get install --no-install-recommends --assume-yes postgresql-client

COPY . .
RUN chmod +x setup.sh
RUN chmod +x update-data.sh

RUN curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | /bin/bash
VOLUME ["/data"]
EXPOSE 8080

ENTRYPOINT ["/bin/sh", "setup.sh"]