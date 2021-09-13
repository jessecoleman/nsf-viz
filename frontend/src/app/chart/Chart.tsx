import { getSortedDivisionAggs, getDivisionOrder, getHighlightedDivision, getLegendFilters, getSelectedTerms, getStackedData, getYearRange, isAgg, isLoadingData } from 'app/selectors';
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
import { colorScales } from 'theme';
import { isFulfilled } from '@reduxjs/toolkit';

let vis: D3Component;

const ChartContainer = styled.div(({ theme }) => `
  flex-grow: 1;
  position: relative;
  .axis {
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
  const dispatch = useAppDispatch();
  const query = useQuery();

  const { counts, amounts } = useAppSelector(getLegendFilters);
  const yearRange = useAppSelector(getYearRange);
  const data = useAppSelector(state => getStackedData(state, query.divisions));
  const divisions = useAppSelector(getSortedDivisionAggs);
  // TODO why does sorting by name not work
  // console.log(divisions);
  const divDomain = divisions.map(d => d.key)
    .filter(key => query.divisions.includes(key));

  // update colors globally with new domain
  Object.values(colorScales).forEach(s => s.domain(divisions.map(d => d.key)));
 
  const highlightedDivision = useAppSelector(getHighlightedDivision);
  const selectedTerms = useAppSelector(getSelectedTerms);
  const loading = useAppSelector(isLoadingData);
  const [ order, ] = useAppSelector(getDivisionOrder);
  const { bool } = useAppSelector(getLegendFilters);
  const [ tooltipProps, setTooltipProps ] = useState<TooltipProps>({});

  useEffect(() => {
    if (visRef.current && !vis && data.length) {
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
  }, [data.length, visRef.current]);
  
  useEffect(() => {
    if (vis && !loading) {
      if (isAgg(order)) {
        vis.updateData(data, divDomain, order);
      } else {
        vis.updateData(data, divDomain);
      }
    }
  }, [vis, loading, order, JSON.stringify(query.divisions)]);
  
  useEffect(() => {
    vis?.highlightGroup(highlightedDivision);
  }, [highlightedDivision]);

  useEffect(() => {
    dispatch(loadData(query));
  }, [JSON.stringify([selectedTerms.length ? selectedTerms : query.terms, yearRange, bool ])]);

  useEffect(() => {
    if (vis) {
      dispatch(loadYears(query)).then((action) => {
        if (isFulfilled(action)) {
          vis.updateYears(action.payload.per_year.map(d => ({
            year: d.key,
            ...d
          })));
        }
      });
    }
  }, [vis, JSON.stringify([selectedTerms.length ? selectedTerms : query.terms, bool ])]);

  const handleTooltipEnter = (dataKey: string, year: number) => {
    setTooltipProps({ dataKey, year });
  };

  const handleTooltipLeave = (key: string, year: number) => {
    // setTooltipProps({});
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
      <ChartLegend />
      <ChartTooltip {...tooltipProps} />
    </ChartContainer>
  );
};

export default Chart;
