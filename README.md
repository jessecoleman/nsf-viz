# Grant Explorer

This project is built with React, Redux, Typescript, Recharts on the frontend and FastAPI, Gensim, Elasticsearch on the backend. 

- [Grant Explorer](#grant-explorer)
- [Building](#building)
	- [Frontend](#frontend)
	- [Backend](#backend)
- [Docker](#docker)
	- [Deploying (with Docker)](#deploying-with-docker)
- [Contributing](#contributing)

# Building

## Frontend
`yarn && yarn start`

## Backend
`poetry install && poetry run python app.py`


# Docker

In the base directory, run:

```
docker-compose --compatibility up --build
```

(The `--compatibility` flag may be needed for docker-compose to respect the memory limit specified in the `docker-compose.yaml` file.)

The app will be served at `http://localhost:8080`

This needs the elasticsearch data to be available in directory: `./elasticsearch_data`.

## Deploying (with Docker)

```
# build the frontend
docker-compose run frontend build

# save the frontend-prod image and the backend image
docker-compose -f docker-compose-prod.yaml build frontend-prod \
  && docker save -o deploy/nsf-viz_frontend-prod.docker.tar nsf-viz_frontend-prod \
  && docker save -o deploy/nsf-viz_backend.docker.tar nsf-viz_backend

# upload the two images to the server
scp -r deploy <address_and_path_to_server>


# run the following commands on the server

# load the docker images
docker load -i deploy/nsf-viz_frontend-prod.docker.tar \
  && docker load -i deploy/nsf-viz_backend.docker.tar

# start all the containers
docker-compose -f docker-compose-prod.yaml --compatibility up
```

The app will be served on port 8080.


# Contributing
The frontend is structured according to the Redux Toolkit standard conventions. Within the `/src/app` directory, you'll find a directory `/components` which contains all the UI elements for the site. There are two reducers: `filterReducer.ts` and `dataReducer.ts` which are responsible for the user filters and server response data respectively.