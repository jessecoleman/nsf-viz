# -*- coding: utf-8 -*-

from pathlib import Path
from typing import Dict, List, Optional, Union
from collections import OrderedDict
import requests
import zipfile
import xml.etree.ElementTree as ET

import numpy as np
import pandas as pd

import logging

root_logger = logging.getLogger()
logger = root_logger.getChild(__name__)


def clean_grants_dataframe(df: pd.DataFrame, min_year=1950) -> pd.DataFrame:
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    logger.debug(f"limiting to only grants after {min_year}")
    df = df[df["date"].dt.year >= min_year]
    df.dropna(subset=["grant_id", "date", "amount", "title"], inplace=True)
    df.drop_duplicates(subset=["grant_id"], inplace=True)
    return df


def uppercase_column_names(df: pd.DataFrame) -> pd.DataFrame:
    # Make column names uppercase
    return df.rename(
        columns={colname: colname.upper() for colname in df.columns.tolist()}
    )


class NSFParser:
    def __init__(self, dirpath: Optional[Union[str, Path]] = None) -> None:
        self.dirpath = dirpath
        if self.dirpath is not None:
            self.dirpath = Path(self.dirpath)

        self.field_paths = OrderedDict(
            {
                "grant_id": ".//AwardID",
                "title": ".//AwardTitle",
                "abstract": ".//AbstractNarration",
                "amount": ".//AwardAmount",
                "date": ".//AwardEffectiveDate",
                "cat1_raw": ".//Division/LongName",
                # "OrganizationCode": ".//Organization/Code",
                # "DirectorateLongName": ".//Directorate/LongName",
                "recipient_org": ".//Institution/Name",
                "investigators": ".//Investigator/PI_FULL_NAME",
            }
        )

    def get_row(self, root) -> Dict:
        row = {}
        for field, path in self.field_paths.items():
            r = root.findall(path)
            # assert len(r) == 1
            # row[field] = r[0].text
            if len(r) == 0:
                row[field] = ""
            else:
                row[field] = ", ".join([item.text for item in r if item.text])
        return row

    def parse_zipfile(self, fp: Union[str, Path]) -> List[Dict]:
        fp = Path(fp)
        rows = []
        with zipfile.ZipFile(fp) as zf:
            for fname in zf.namelist():
                with zf.open(fname, "r") as f:
                    try:
                        tree = ET.parse(f)
                        root = tree.getroot()
                        row = self.get_row(root)
                        row["zipfile"] = fp.name
                        rows.append(row)
                    except ET.ParseError:
                        logger.info(f"parse error: zipfile: {fp}, fname: {fname}")
        return rows

    def parse_directory(self, dirpath: Optional[Union[str, Path]] = None) -> List[Dict]:
        if dirpath is None:
            dirpath = self.dirpath
        else:
            dirpath = Path(dirpath)
        rows = []
        for fp in dirpath.glob("*.zip"):
            rows.extend(self.parse_zipfile(fp))
        return rows

    def parse_directory_pandas(
        self, dirpath: Optional[Union[str, Path]] = None
    ) -> pd.DataFrame:
        if dirpath is None:
            dirpath = self.dirpath
        else:
            dirpath = Path(dirpath)
        rows = self.parse_directory(dirpath)
        df = pd.DataFrame(rows)
        return df

    def parse_directory_pandas_and_clean(
        self, dirpath: Optional[Union[str, Path]] = None
    ) -> pd.DataFrame:
        if dirpath is None:
            dirpath = self.dirpath
        else:
            dirpath = Path(dirpath)
        df = self.parse_directory_pandas(dirpath)
        df = df[self.field_paths.keys()]
        df["external_url"] = df.grant_id.map(
            lambda x: f"https://www.nsf.gov/awardsearch/showAward?AWD_ID={x}"
        )
        df = clean_grants_dataframe(df)
        return df


class NIHParser:
    def __init__(self, dirpath: Optional[Union[str, Path]] = None) -> None:
        self.dirpath = dirpath
        if self.dirpath is not None:
            self.dirpath = Path(self.dirpath)

        self.column_mapper = OrderedDict(
            {
                "CORE_PROJECT_NUM": "grant_id",
                "PROJECT_TITLE": "title",
                "ABSTRACT_TEXT": "abstract",
                # "TOTAL_COST": "amount",
                "core_project_total_cost": "amount",
                # "notice_date": "date",
                "FY": "date",
                "IC_NAME": "cat1_raw",
                "PI_NAMES": "investigators",
                "ORG_NAME": "recipient_org",
            }
        )

    def parse_directory_pandas(
        self, dirpath: Optional[Union[str, Path]] = None, abstracts: bool = True
    ) -> pd.DataFrame:
        if dirpath is None:
            dirpath = self.dirpath
        else:
            dirpath = Path(dirpath)
        dfs = []
        # rename_cols = {"FUNDING_Ics": "FUNDING_ICs"}

        for fp in dirpath.glob("RePORTER_PRJ_C*.zip"):
            this_df: pd.DataFrame = pd.read_csv(
                fp, encoding="latin", on_bad_lines="warn"
            )
            # Make column names uppercase
            this_df = uppercase_column_names(this_df)
            this_df["zipfile"] = fp.name
            dfs.append(this_df)
        df: pd.DataFrame = pd.concat(dfs)
        df.dropna(subset=["APPLICATION_ID"], inplace=True)
        df["notice_date"] = pd.to_datetime(df["AWARD_NOTICE_DATE"], errors="coerce")

        if abstracts is True:
            # get abstracts
            df_abstracts: pd.DataFrame = pd.concat(
                pd.read_csv(fp, encoding="latin", on_bad_lines="warn")
                for fp in dirpath.glob("RePORTER_PRJABS_C*.zip")
            )
            df_abstracts.dropna(subset=["APPLICATION_ID"], inplace=True)
            df = df.merge(df_abstracts, how="left", on="APPLICATION_ID")
        else:
            df["ABSTRACT_TEXT"] = ""

        # check for updated funding information
        df_updated_funding = self.get_updated_funding_info(dirpath)
        if not df_updated_funding.empty:
            # merge in updated funding information
            df = self.merge_updated_funding_info(df, df_updated_funding)

        return df

    def parse_directory_pandas_and_clean(
        self, dirpath: Optional[Union[str, Path]] = None, abstracts: bool = True
    ) -> pd.DataFrame:
        if dirpath is None:
            dirpath = self.dirpath
        else:
            dirpath = Path(dirpath)
        df = self.parse_directory_pandas(dirpath)
        logger.debug(f"NIH DATA: dataframe shape is {df.shape}")

        # For now, limit to only R01 grants
        logger.debug("limiting to only R01 grants")
        df = df.loc[df.ACTIVITY == "R01", :]
        logger.debug(f"NIH DATA: dataframe shape is {df.shape}")

        # get total cost for each grant over all years
        df["core_project_total_cost"] = df.groupby("CORE_PROJECT_NUM")[
            "TOTAL_COST"
        ].transform("sum")

        df["num_years"] = df.groupby("CORE_PROJECT_NUM")["APPLICATION_ID"].transform(
            "count"
        )

        # keep only the first row (year) for each grant
        logger.debug(
            "keeping only the first row (year) for each grant, resulting in one row per grant"
        )
        # df = df.sort_values(["CORE_PROJECT_NUM", "notice_date"]).drop_duplicates(
        #     subset=["CORE_PROJECT_NUM"], keep="first"
        # )
        df = df.sort_values(["CORE_PROJECT_NUM", "FY"]).drop_duplicates(
            subset=["CORE_PROJECT_NUM"], keep="first"
        )
        logger.debug(f"NIH DATA: dataframe shape is {df.shape}")

        # # For now, limit to only grants after 1970
        # logger.debug("limiting to only grants after 1970")
        # df = df.loc[df.notice_date.dt.year >= 1970, :]
        # logger.debug(f"NIH DATA: dataframe shape is {df.shape}")

        external_url = df["APPLICATION_ID"].map(
            lambda application_id: f"https://reporter.nih.gov/project-details/{application_id}"
        )

        df = df[self.column_mapper.keys()].rename(columns=self.column_mapper)

        df["external_url"] = external_url

        # convert "date" column from float (year) to date type
        df["date"] = pd.to_datetime(df["date"].map(lambda x: f"{x:.0f}-01-01"))

        # ! Note that when this cleaning is done, it will remove all rows with missing values for TOTAL_COST.
        # ! It seems like this will remove all sub-projects, and leave only full projects.
        # ! We should revisit this to make sure this is what we want to do.
        # ! ...actually, this may not apply to R01 grants. But we should revisit if we start including others, e.g., P01
        df = clean_grants_dataframe(df)
        return df

    def get_updated_funding_info(self, dirpath: Union[str, Path]) -> pd.DataFrame:
        dirpath = Path(dirpath)
        files = dirpath.glob("RePORTER_PRJFUNDING_C_*.zip")
        dfs = []
        for fp in files:
            this_df: pd.DataFrame = pd.read_csv(
                fp, encoding="latin", on_bad_lines="warn"
            )
            dfs.append(this_df)
        if len(dfs) == 0:
            # return an empty dataframe
            return pd.DataFrame()
        df_updated_funding: pd.DataFrame = pd.concat(dfs)
        df_updated_funding = uppercase_column_names(df_updated_funding)
        return df_updated_funding

    def merge_updated_funding_info(
        self, df: pd.DataFrame, df_updated_funding: pd.DataFrame
    ) -> pd.DataFrame:
        rename_cols = {
            colname: f"{colname}_old"
            for colname in df_updated_funding.columns
            if colname != "APPLICATION_ID"
        }
        df = df.rename(columns=rename_cols)
        df = df.merge(df_updated_funding, how="left", on="APPLICATION_ID")
        for colname, colname_old in rename_cols.items():
            df[colname].fillna(df[colname_old], inplace=True)
            df.drop(columns=[colname_old], inplace=True)
        return df


class DoDParser:
    def __init__(self, dirpath: Optional[Union[str, Path]] = None) -> None:
        self.dirpath = dirpath
        if self.dirpath is not None:
            self.dirpath = Path(self.dirpath)

        self.column_mapper = OrderedDict(
            {
                "Award Number": "grant_id",
                "Project Title": "title",
                "Award Abstract": "abstract",
                "Anticipated Award Amount": "amount",
                "Potential Period of Performance Start": "date",
                "Funding Agency Name": "cat1_raw",
                "Recipient Organization": "recipient_org",
                "pi_name": "investigators",
            }
        )

    def parse_directory_pandas(
        self, dirpath: Optional[Union[str, Path]] = None
    ) -> pd.DataFrame:
        if dirpath is None:
            dirpath = self.dirpath
        else:
            dirpath = Path(dirpath)
        dfs = []
        # rename_cols = {"FUNDING_Ics": "FUNDING_ICs"}

        for fp in dirpath.glob("*.csv"):
            this_df: pd.DataFrame = pd.read_csv(fp)
            dfs.append(this_df)
        df: pd.DataFrame = pd.concat(dfs).drop_duplicates()

        return df

    def parse_directory_pandas_and_clean(
        self, dirpath: Optional[Union[str, Path]] = None
    ) -> pd.DataFrame:
        if dirpath is None:
            dirpath = self.dirpath
        else:
            dirpath = Path(dirpath)
        df = self.parse_directory_pandas(dirpath)
        df["pi_name"] = df["PI Last Name"] + " " + df["PI First Name"]
        df = df[self.column_mapper.keys()].rename(columns=self.column_mapper)
        df = clean_grants_dataframe(df)
        return df
