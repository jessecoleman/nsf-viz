import { getSortedDivisionAggs, getHighlightedDivision, getSelectedTerms, getStackedData, isAgg, isLoadingData, isYearsLoading, getYearData } from 'app/selectors';
import { useAppDispatch, useAppSelector } from 'app/store';
import { useQuery } from 'app/query';

import ChartTooltip, { TooltipProps } from './ChartTooltip';
import ChartLegend from './ChartLegend';
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
  const [ query, setQuery ] = useQuery();
  // const [ queryDivisions ] = useQueryParam('divisions', DelimitedArrayParam);

  // TODO reimplement this?
  // const { counts, amounts } = useAppSelector(getLegendFilters);
  // const yearRange = useAppSelector(getYearRange);
  const data = useAppSelector(state => getStackedData(state, query));
  const yearData = useAppSelector(getYearData);
  const divisions = Object.values(useAppSelector(state => getSortedDivisionAggs(state, query)));
  // TODO why are colors not persistent
  const divDomain = divisions.map(d => d.key)
    .filter(key => query.divisions?.includes(key));

  const highlightedDivision = useAppSelector(getHighlightedDivision);
  const selectedTerms = useAppSelector(getSelectedTerms);
  const loading = useAppSelector(isLoadingData);
  const yearLoading = useAppSelector(isYearsLoading);
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
        // onTooltipLeave: handleTooltipLeave,
        onBarClick: handleBarClick,
        onBrushEnded: handleSetYearRange,
      });
    }
  }, [visRef.current]);
  
  // update data on filter changes
  useEffect(() => {
    if (vis && !loading) {
      if (isAgg(query.sort)) {
        vis.update(data, divDomain, query.sort);
      } else {
        vis.update(data, divDomain);
      }
      if (query.start && query.end) {
        vis.timeline.setYearRange(query.start, query.end);
      }
    }
  }, [vis, loading, query.sort, JSON.stringify(query.divisions)]);
  
  // update timeline on year change
  useEffect(() => {
    if (vis && !yearLoading) {
      if (isAgg(query.sort)) {
        vis.timeline.update(yearData, query.sort);
      } else {
        vis.timeline.update(yearData);
      }
    }
  }, [vis, yearLoading, query.sort]);
  
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
    console.log('loading');
    dispatch(loadData(query));
  }, [JSON.stringify([selectedTerms.length ? selectedTerms : query.terms, query.org, query.intersection, query.start, query.end ])]);

  useEffect(() => {
    dispatch(loadYears(query));
  }, [JSON.stringify([selectedTerms.length ? selectedTerms : query.terms, query.org, query.intersection ])]);

  const handleTooltipEnter = (dataKey: string, year: number) => {
    setTooltipProps({ dataKey, year });
  };

  // TODO maybe add callback
  // const handleTooltipLeave = (key: string, year: number) => {
  //   // setTooltipProps({});
  // };
  
  const handleSetYearRange = ([ start, end ]: [ number, number ]) => {
    setQuery({ start, end });
  };

  const handleBarClick = (key: string, year: number) => {
    dispatch(clearGrants());
    setQuery({
      grantDialogOpen: true,
      grantDialogYear: year,
      grantDialogDivision: key,
    });
  };

  return (
    <ChartContainer ref={visRef}>
      <ChartLegend />
      <ChartTooltip {...tooltipProps} />
    </ChartContainer>
  );
};

export default Chart;
