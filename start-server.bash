eval "$(ssh-agent -s)"
ssh-add ~/.ssh/docker_repo_key 
git pull git@github.com:LuEklund/LucasBot.git 
DOCKER_BUILDKIT=1 docker build --ssh default=${HOME}/.ssh/docker_repo_key -t my-bun-app:latest .

docker run -d -p 3000:3000 my-bun-app:latest