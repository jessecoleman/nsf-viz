from typing import List
from elasticsearch import Elasticsearch
from elasticsearch_dsl import Search


def get_all_grant_ids(
    es_client: Elasticsearch, agency: str, index: str = "grants"
) -> List[str]:
    s = (
        Search(using=es_client, index=index)
        .filter("term", agency=agency)
        .source(fields={"include": "grant_id"})
    )
    grant_ids = [hit.grant_id for hit in s.scan()]
    return grant_ids
