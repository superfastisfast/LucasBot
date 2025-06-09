eval "$(ssh-agent -s)"
ssh-add ~/.ssh/docker_repo_key 
DOCKER_BUILDKIT=1 docker build --ssh default=${HOME}/.ssh/docker_repo_key -t my-bun-app:latest .