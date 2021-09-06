import re
from typing import List, Optional, Tuple
from enum import Enum
from datetime import datetime
from pydantic import BaseModel as PyBaseModel


def to_camel(snake: str):
    return re.sub(r'(?<!^)(?=[A-Z])', '_', snake).lower()


class BaseModel(PyBaseModel):
    class Config:
        pass
        # alias_generator = to_camel


class Division(BaseModel):
    key: str
    name: str
    selected: bool
    count: Optional[int]
    amount: Optional[int]


class SearchRequest(BaseModel):
    boolQuery: str
    terms: List[str]
    dependant: str
    divisions: List[str]
    fields: List[str]
    year_range: Optional[List[int]]


class GrantAmounts(BaseModel):
    value: int


class Bucket(BaseModel):
    key: str
    doc_count: int
    grant_amounts: GrantAmounts


class Aggregate(BaseModel):
    key: Optional[str]
    key_as_string: Optional[str]
    doc_count: int
    grant_amounts: Optional[GrantAmounts]


class DivisionBuckets(BaseModel):
    buckets: List[Bucket]


class DivisionAggregate(Aggregate):
    divisions: DivisionBuckets


class SearchResponse(BaseModel):
    per_division: List[DivisionAggregate]
    sum_total: List[Aggregate]


class YearsResponse(BaseModel):
    per_year: List[Aggregate]


class Grant(BaseModel):
    id: str
    score: float
    title: str
    date: str
    amount: int
    division: str
    division_key: str


class Order(str, Enum):
    asc = 'asc'
    desc = 'desc'


class OrderBy(str, Enum):
    date = 'date'
    amount = 'amount'


class GrantField(str, Enum):
    title = 'title'
    abstract = 'abstract'


class GrantsRequest(SearchRequest):
    idx: int
    order: str #Order,
    order_by: Optional[str] = 'title'
    toggle: bool
    

class Term(BaseModel):
    term: str
    count: int