import { getSortedDivisionAggs, getDivisionOrder, getHighlightedDivision, getLegendFilters, getSelectedTerms, getStackedData, getYearRange, isAgg, isLoadingData, getYearAgg, isYearsLoading } from 'app/selectors';
import { useAppDispatch, useAppSelector } from 'app/store';
import { useQuery } from 'app/hooks';

import ChartTooltip, { TooltipProps } from './ChartTooltip';
import ChartLegend from './ChartLegend';
import { setGrantDialogOpen, setGrantFilter, setYearRange } from 'app/filterReducer';
import { clearGrants } from 'app/dataReducer';
import { loadData, loadYears } from 'app/actions';
import { useEffect, useRef, useState } from 'react';
import BarChart from './D3Chart';
import styled from '@emotion/styled';
import { colorScales } from 'theme';

let vis: BarChart;

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

type ChartProps = {
  width: number
  height: number
}

const Chart = (props: ChartProps) => {

  const visRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const query = useQuery();

  // TODO reimplement this?
  // const { counts, amounts } = useAppSelector(getLegendFilters);
  const yearRange = useAppSelector(getYearRange);
  const data = useAppSelector(getStackedData);
  const divisions = Object.values(useAppSelector(getSortedDivisionAggs));
  // TODO why are colors not persistent
  const divDomain = divisions.map(d => d.key)
    .filter(key => query.divisions.includes(key));

  const highlightedDivision = useAppSelector(getHighlightedDivision);
  const selectedTerms = useAppSelector(getSelectedTerms);
  const loading = useAppSelector(isLoadingData);
  const yearLoading = useAppSelector(isYearsLoading);
  const [ order, ] = useAppSelector(getDivisionOrder);
  const { bool } = useAppSelector(getLegendFilters);
  const [ tooltipProps, setTooltipProps ] = useState<TooltipProps>({});

  // update colors globally with new domain
  useEffect(() => {
    Object.values(colorScales).forEach(s => s.domain(divisions.map(d => d.key)));
  }, [vis]);

  // mount chart on first load
  useEffect(() => {
    if (visRef.current && !vis) {
      vis = new BarChart({
        dimensions: props,
        containerEl: visRef.current,
        onTooltipEnter: handleTooltipEnter,
        onTooltipLeave: handleTooltipLeave,
        onBarClick: handleBarClick,
        onBrushEnded: handleBrush,
      });
    }
  }, [visRef.current]);
  
  // update data on filter changes
  useEffect(() => {
    if (vis && !loading) {
      if (isAgg(order)) {
        vis.update(data, divDomain, order);
      } else {
        vis.update(data, divDomain);
      }
    }
  }, [vis, loading, order, JSON.stringify(query.divisions)]);
  
  // update timeline on year change
  useEffect(() => {
    if (vis && !yearLoading) {
      if (isAgg(order)) {
        vis.timeline.update(yearData, order);
      } else {
        vis.timeline.update(yearData);
      }
    }
  }, [vis, yearLoading, order]);
  
  // update bar styles on highlight
  useEffect(() => {
    vis?.highlightGroup(highlightedDivision);
  }, [highlightedDivision]);

  // update chart on window resize
  useEffect(() => {
    if (props.height) vis.measure(props.width, props.height);
  }, [props.width, props.height]);

  // query backend on query change
  useEffect(() => {
    dispatch(loadData(query));
  }, [JSON.stringify([selectedTerms.length ? selectedTerms : query.terms, bool, yearRange ])]);

  useEffect(() => {
    dispatch(loadYears(query));
  }, [JSON.stringify([selectedTerms.length ? selectedTerms : query.terms, bool ])]);

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
