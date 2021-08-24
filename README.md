# Grant Explorer

This project is built with React, Redux, Typescript, Recharts on the frontend and FastAPI, Gensim, Elasticsearch on the backend. 

- [Grant Explorer](#grant-explorer)
- [Building](#building)
	- [Frontend](#frontend)
	- [Backend](#backend)
- [Docker](#docker)
- [Contributing](#contributing)

# Building

## Frontend
`yarn && yarn start`

## Backend
`poetry install && poetry run python app.py`


# Docker

In the base directory, run:

```
docker-compose up --build
```

The app will be served at `http://localhost:8080`

This needs the elasticsearch data to be available in directory: `./elasticsearch_data`.


# Contributing
The frontend is structured according to the Redux Toolkit standard conventions. Within the `/src/app` directory, you'll find a directory `/components` which contains all the UI elements for the site. There are two reducers: `filterReducer.ts` and `dataReducer.ts` which are responsible for the user filters and server response data respectively.