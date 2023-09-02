import re
from typing import Any, List, Optional, Tuple
from enum import Enum
from pydantic import BaseModel as PyBaseModel, Field


def to_camel(snake: str):
    return re.sub(r'(?<!^)(?=[A-Z])', '_', snake).lower()


class BaseModel(PyBaseModel):
    class Config:
        pass
        alias_generator = to_camel
        allow_population_by_field_name = True


class SubDirectory(BaseModel):
    abbr: str
    name: str
    href: str
    est: Optional[int]
    desc: Optional[str]


class Directory(SubDirectory):
    departments: List[SubDirectory]
    

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
    

class DirectoryAggregate(BaseModel):
    key: str
    count: int
    amount: int
    divisions: List[DivisionAggregate]
 

class YearDivisionAggregate(BaseModel):
    key: int
    count: int
    amount: int
    divisions: List[DivisionAggregate]
   

class SearchRequest(BaseModel):
    intersection: Optional[bool] = False
    terms: List[str]
    org: str
    divisions: List[str]
    match: Optional[List[str]]
    start: Optional[int]
    end: Optional[int]


class SearchResponse(BaseModel):
    bars: List[YearDivisionAggregate]
    #timeline: List[DivisionAggregate]
    divisions: List[DirectoryAggregate]


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
    abstract: Optional[str] = None
    cat1: str
    cat1_raw: str
    cat2: Optional[str]
    cat2_raw: Optional[str]
    cat3: Optional[str]
    cat3_raw: Optional[str]
    external_url: Optional[str]
    investigators: Optional[str]
    recipient_org: Optional[str]
    # related_terms: Optional[List[str]]


class Order(str, Enum):
    asc = 'asc'
    desc = 'desc'


class OrderBy(str, Enum):
    date = 'date'
    amount = 'amount'


class GrantField(str, Enum):
    title = 'title'
    abstract = 'abstract'


class Term(BaseModel):
    term: str
    stem: str
    forms: List[str]
    

class TermTopic(BaseModel):
    term: str
    count: int


class Topic(BaseModel):
    terms: List[TermTopic]