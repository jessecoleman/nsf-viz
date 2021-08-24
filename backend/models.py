from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel


class Division(BaseModel):
    title: str


class SearchRequest(BaseModel):
    boolQuery: str
    terms: List[str]
    dependant: str
    divisions: List[str]
    fields: List[str]


class Bucket(BaseModel):
    key: str
    doc_count: int
    grant_amounts: Dict[str, int]


class Aggregate(BaseModel):
    key: Optional[str]
    key_as_string: Optional[str]
    doc_count: int
    grant_amounts: Optional[Dict[str, int]]


class DivisionBuckets(BaseModel):
    buckets: List[Bucket]


class DivisionAggregate(Aggregate):
    divisions: DivisionBuckets


class SearchResponse(BaseModel):
    per_year: List[Aggregate]
    per_division: List[DivisionAggregate]
    sum_total: List[Aggregate]


class Order(str, Enum):
    asc = 'asc'
    desc = 'desc'


class OrderBy(str, Enum):
    date = 'date'
    amount = 'amount'


class GrantField(str, Enum):
    title = 'title'
    abstract = 'abstract'


class GrantsRequest(BaseModel):
    idx: int
    order: str #Order,
    order_by: Optional[str] = 'title'
    terms: List[str]
    fields: List[str] # GrantField]
    divisions: List[str]
    toggle: bool
    
    class Config:
        pass
        # use_enum_values = True
        

class Term(BaseModel):
    term: str
    count: int