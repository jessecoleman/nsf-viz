# Grant Explorer

This project is built with React, Redux, Typescript, Recharts on the frontend and FastAPI, Gensim, Elasticsearch on the backend. 

# Building

## Frontend
`yarn && yarn start`

## Backend
`poetry install && poetry run python app.py`


# Contributing
The frontend is structured according to the Redux Toolkit standard conventions. Within the `/src/app` directory, you'll find a directory `/components` which contains all the UI elements for the site. There are two reducers: `filterReducer.ts` and `dataReducer.ts` which are responsible for the user filters and server response data respectively.