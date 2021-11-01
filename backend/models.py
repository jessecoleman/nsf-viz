import re
from typing import Any, List, Optional, Tuple
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


class YearAggregate(BaseModel):
    key: int
    count: int
    amount: int
  

class DivisionAggregate(BaseModel):
    key: str
    count: int
    amount: int


class YearDivisionAggregate(BaseModel):
    key: int
    count: int
    divisions: List[DivisionAggregate]
   

class SearchRequest(BaseModel):
    boolQuery: str
    terms: List[str]
    divisions: List[str]
    fields: List[str]
    year_range: Optional[List[int]]


class SearchResponse(BaseModel):
    per_year: List[YearDivisionAggregate]
    overall: List[DivisionAggregate]


class YearsResponse(BaseModel):
    per_year: List[YearAggregate]


class Grant(BaseModel):
    # see also: Grant class in index_grants.py
    id: str
    grant_id: str  # e.g. NSF AwardID
    agency: str
    score: float
    title: str
    date: str
    amount: int
    cat1: str
    cat1_raw: str
    cat2: Optional[str]
    cat2_raw: Optional[str]
    cat3: Optional[str]
    cat3_raw: Optional[str]


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