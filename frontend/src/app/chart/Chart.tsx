import { getDivisionAggs, getHighlightedDivision, getLegendFilters, getSelectedTerms, getStackedData, getYearRange } from 'app/selectors';
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
import { colorScales } from 'theme';

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
  #legend {
    position: absolute;
    left: 75px;
    top: 25px;
  }
  #tooltip {
    pointer-events: none;
    position: absolute;
    visibility: hidden;
    width: 30em;
    &.visible {
      visibility: initial;
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
  const divDomain = divisions
    .filter(d => query.divisions.includes(d.key))
    .map(d => d.key);

  // update colors globally with new domain
  Object.values(colorScales).forEach(s => s.domain(divDomain));
 
  const highlightedDivision = useAppSelector(getHighlightedDivision);
  const selectedTerms = useAppSelector(getSelectedTerms);
  const { bool } = useAppSelector(getLegendFilters);
  const [ tooltipProps, setTooltipProps ] = useState<TooltipProps>({});

  useEffect(() => {
    if (visRef.current && !vis) {
      vis = new D3Component({
        containerEl: visRef.current,
        data,
        divDomain,
        onTooltipEnter: handleTooltipEnter,
        onTooltipLeave: handleTooltipLeave,
        onBarClick: handleBarClick,
        onBrushEnded: handleBrush,
      });
    }
  }, [visRef.current]);
  
  useEffect(() => {
    if (data.length) {
      vis.update(data, divDomain);
    }
  }, [JSON.stringify(data)]);
  
  useEffect(() => {
    vis.highlightGroup(highlightedDivision);
  }, [highlightedDivision]);

  useEffect(() => {
    dispatch(loadData(query)).then(data => {
      // TODO directly update vis here instead of using listener above
    });
  }, [JSON.stringify([selectedTerms.length ? selectedTerms : query.terms, yearRange, bool ])]);

  useEffect(() => {
    dispatch(loadYears(query)).then(({ payload }) => {
      if (!payload) return;
      vis.updateYears((payload as YearsResponse).per_year.map(d => ({
        year: d.key,
        amount: d.amount,
        count: d.count,
      })));
      // TODO directly update vis here instead of using listener above
    });
  }, [JSON.stringify([selectedTerms.length ? selectedTerms : query.terms, bool ])]);

  const handleTooltipEnter = (dataKey: string, year: number) => {
    setTooltipProps({ dataKey, year });
  };

  const handleTooltipLeave = (key: string, year: number) => {
    setTooltipProps({});
  };
  
  const handleBrush = (selection: [ number, number ]) => {
    dispatch(setYearRange(selection));
  };

  const handleBarClick = (key: string, year: number) => {
    // TODO this is horribly clunky
    // don't show popup unless there's data
    // const total = e.activePayload?.reduce((sum, year) => (
    //   sum + Object.entries(year.payload as Record<string, number>).reduce((divSum: number, div: [string, number]) => (
    //     div[0].endsWith('count') || div[0].endsWith('amount') ? divSum + div[1] : divSum
    //   ), 0)
    // ), 0);
    // if (total) {
    dispatch(clearGrants());
    dispatch(setGrantFilter({ year }));
    dispatch(setGrantDialogOpen(true));
  };

  return (
    <ChartContainer ref={visRef}>
      <ChartTooltip {...tooltipProps} />
      <ChartLegend />
    </ChartContainer>
  );
};

export default Chart;
