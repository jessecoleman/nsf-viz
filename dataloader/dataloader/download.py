# -*- coding: utf-8 -*-

from pathlib import Path
from typing import Dict, List, Optional, Union
import requests

import logging

root_logger = logging.getLogger()
logger = root_logger.getChild(__name__)

NSF_DOWNLOAD_URL = "https://www.nsf.gov/awardsearch/download"

NIH_EXPORTER_DOWNLOAD_BASE_URL = "https://exporter.nih.gov/CSVs/final"
# Examples of URLs:
# https://exporter.nih.gov/CSVs/final/RePORTER_PRJ_C_FY2015.zip
# https://exporter.nih.gov/CSVs/final/RePORTER_PRJABS_C_FY2010.zip
# https://exporter.nih.gov/CSVs/final/RePORTER_PUB_C_2010.zip
# https://exporter.nih.gov/CSVs/final/RePORTER_PUBLNK_C_2010.zip
# https://exporter.nih.gov/CSVs/final/RePORTER_PRJFUNDING_C_FY1995.zip


def nsf_download_awards_by_year(
    year: Union[int, str], outfname: Optional[Union[str, Path]] = None
) -> None:
    url = NSF_DOWNLOAD_URL
    year = str(year)
    if outfname is None:
        outfname = f"{year}.zip"
    outfp = Path(outfname)
    params = {
        "DownloadFileName": year,
        "All": "true",
    }
    logger.debug(f"Beginning download for year {year}...")
    r = requests.get(url, params=params)
    r.raise_for_status()
    logger.debug(f"Download successful. Saving to {outfp}")
    outfp.write_bytes(r.content)


def nih_download_awards_by_year(
    year: Union[int, str], data_file: str = "PROJECTS", outdir: Union[str, Path] = "."
) -> None:
    year = str(year)
    filetype = "C"  # CSV
    data_file = data_file.upper()
    if data_file in ["PROJECT", "PROJECTS", "PRJ"]:
        fname = f"RePORTER_PRJ_{filetype}_FY{year}.zip"
    elif data_file.startswith("ABS"):
        fname = f"RePORTER_PRJABS_{filetype}_FY{year}.zip"
    elif data_file == "PUB" or data_file.startswith("PUBLICATION"):
        fname = f"RePORTER_PUB_{filetype}_{year}.zip"
    elif data_file == "PUBLNK" or data_file.startswith("LINK"):
        fname = f"RePORTER_PUBLNK_{filetype}_{year}.zip"
    elif data_file.startswith("UPDATED") or data_file.startswith("PRJFUND"):
        # years 1985 to 1999 have supplemental files with funding information
        fname = f"RePORTER_PRJFUNDING_{filetype}_FY{year}.zip"
    else:
        raise ValueError(
            "data_file must be one of ['PROJECT', 'ABSTRACT', 'PUBLICATIONS', 'LINK TABLES']"
        )
    url = f"{NIH_EXPORTER_DOWNLOAD_BASE_URL}/{fname}"
    outdir = Path(outdir)
    outfp = outdir.joinpath(fname)
    logger.debug(f"Beginning download for year {year}...")
    r = requests.get(url)
    r.raise_for_status()
    logger.debug(f"Download successful. Saving to {outfp}")
    outfp.write_bytes(r.content)
