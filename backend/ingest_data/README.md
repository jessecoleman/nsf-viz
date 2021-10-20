# Ingest data

Instructions for ingesting grants data from a CSV file into Elasticsearch, and training the gensim model.

1. Put the grants data in the `assets` directory (we'll call it `grants_data.csv`).

2. Make sure the docker containers are running. We'll need the backend container and the Elasticsearch container, with the appropriate volumes mounted and ports exposed. So, if they are not already running, in the base directory, run:
   ```sh
   docker-compose up --build
   ```
3. In another terminal window, connect to the backend container by running:

   ```sh
   docker exec -it nsf-viz_backend_1 /bin/bash
   ```

   This will start an interactive terminal running bash in the directory `/usr/local/src/app/backend`

4. In this interactive terminal, run:

   ```sh
   python3 ingest_data/ingest.py assets/grants_data.csv assets
   ```

   This will take a while, and create (or replace) the following files in the `assets` directory.

   ```
   data.txt
   intermediate.txt
   nsf_w2v_model
   nsf_w2v_model.syn1neg.npy
   nsf_w2v_model.wv.vectors.npy
   terms.txt
   ```

   It will also create (or replace) the `grants` and `grants-suggest` indices in elasticsearch.
