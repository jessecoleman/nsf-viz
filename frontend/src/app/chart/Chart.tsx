import * as d3 from 'd3';
import { green, deepPurple } from '@material-ui/core/colors';

import { getDivisionAggs, getLegendFilters, getSelectedTerms, getStackedData, getYearRange } from 'app/selectors';
import { useAppDispatch, useAppSelector } from 'app/store';
import { useQuery } from 'app/hooks';

import ChartTooltip, { TooltipProps } from './ChartTooltip';
import ChartLegend from './ChartLegend';
import { setGrantDialogOpen, setGrantFilter, setYearRange } from 'app/filterReducer';
import { clearGrants } from 'app/dataReducer';
import { loadData, loadYears } from 'app/actions';
import { useEffect, useRef, useState } from 'react';
import D3Component from './D3Chart';
import styled from '@emotion/styled';
import { YearsResponse } from 'api/models/YearsResponse';

export const interleave = <T extends unknown>(v: T, i: number, a: T[]) => (
  a[Math.trunc(i / 2) + (i % 2 ? a.length / 2 : 0)]
);
const greens = Object.values(green).slice(0, -4).map(interleave);
export const greenScale = d3.scaleOrdinal(greens);
const purples = Object.values(deepPurple).slice(0, -4).map(interleave);
export const deepPurpleScale = d3.scaleOrdinal(purples);

let vis: D3Component;

const ChartContainer = styled.div(({ theme }) => `
  position: relative;
  .axis {
    padding: 16px;
    height: 100%;
    font: Helvetica;
    font-size: 14px;
    font-family: "Open Sans", sans-serif;
    font-weight: 500;
  }
  .gridline {
    stroke: ${theme.palette.grey[100]};
    stroke-dasharray: 5 5;
    // shape-rendering: crispEdges;
    line {
      stroke: ${theme.palette.grey[400]};
    }
    .domain {
      display: none;
    }
  }
  .selected {
    outline-style: solid;
    outline-color: black;
    outline-width: 2px;
    outline-offset: -2px;
  }
  .tooltip {
    display: none;
    .visible {
      display: initial;
    } 
  }
`);

const Chart = () => {

  const visRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const query = useQuery();

  const { counts, amounts } = useAppSelector(getLegendFilters);
  const yearRange = useAppSelector(getYearRange);
  // const perDivision = useAppSelector(getPerDivision);
  const data = useAppSelector(state => getStackedData(state, query.divisions));
  const divisions = useAppSelector(getDivisionAggs);
  const selectedTerms = useAppSelector(getSelectedTerms);
  const { bool } = useAppSelector(getLegendFilters);
  const [ tooltipProps, setTooltipProps ] = useState<TooltipProps>({});

  const handleTooltipEnter = (key: string, year: number) => {
    console.log('entered', key, year);
    setTooltipProps({
      key,
      year,
    });
  };

  const handleTooltipLeave = (key: string, year: number) => {
    console.log('left', key, year);
    setTooltipProps({
      key,
      year,
    });
  };
  
  const handleBrush = (selection: [ number, number ]) => {
    console.log(selection);
    dispatch(setYearRange(selection));
  };

  useEffect(() => {
    console.log(tooltipRef.current);
    if (visRef.current && !vis) {
      vis = new D3Component({
        containerEl: visRef.current,
        //tooltipEl: tooltipRef.current,
        data,
        onTooltipEnter: handleTooltipEnter,
        onTooltipLeave: handleTooltipLeave,
        onBrushEnded: handleBrush,
      });
    }
  }, [visRef.current, tooltipRef.current]);
  
  useEffect(() => {
    if (data.length) {
      const divDomain = query.divisions; //.sort(comparator);
      vis.update(data, divDomain);
    }
  }, [JSON.stringify(data)]);

  useEffect(() => {
    dispatch(loadData(query)).then(data => {
      console.log(data);
      // TODO directly update vis here instead of using listener above
    });
  }, [JSON.stringify([selectedTerms.length ? selectedTerms : query.terms, yearRange, bool ])]);

  useEffect(() => {
    dispatch(loadYears(query)).then(({ payload }) => {
      console.log('loadedYears', data);
      if (!payload) return;
      vis.updateYears((payload as YearsResponse).per_year.map(d => ({
        year: +d.key_as_string!,
        amount: d.grant_amounts?.value ?? 0,
        count: d.doc_count,
      })));
      console.log(data);
      // TODO directly update vis here instead of using listener above
    });
  }, [JSON.stringify([selectedTerms.length ? selectedTerms : query.terms, bool ])]);

  const handleClick = e => {
    if (e?.activeLabel) {
      console.log(e);
      // TODO this is horribly clunky
      // don't show popup unless there's data
      const total = e.activePayload?.reduce((sum, year) => (
        sum + Object.entries(year.payload as Record<string, number>).reduce((divSum: number, div: [string, number]) => (
          div[0].endsWith('count') || div[0].endsWith('amount') ? divSum + div[1] : divSum
        ), 0)
      ), 0);
      if (total) {
        dispatch(clearGrants());
        dispatch(setGrantFilter({ year: e.activeLabel }));
        dispatch(setGrantDialogOpen(true));
      }
    }
  };

  const divMap = Object.fromEntries(divisions.map(d => [d.key, d.count]));
  const comparator = (a: string, b: string) => divMap[b] - divMap[a];

  const divDomain = query.divisions.sort(comparator);
  greenScale.domain(divDomain);
  deepPurpleScale.domain(divDomain);
  
  return (
    <ChartContainer ref={visRef}>
      { /* <ChartTooltip ref={tooltipRef} {...tooltipProps} /> */ }
    </ChartContainer>
  );
};

export default Chart;
