# electron-code-server

Basic idea is to select a github repo, spin up a docker container, clone the repo inside that container and run code-server in that container, so that user is shown VSCode UI in the electron app which would directly work with the contents inside the container, thereby providing an isolated environment.