import { useGrantsDialogQuery, useQuery } from 'app/query';

import ChartTooltip, { TooltipProps } from './ChartTooltip';
import ChartLegend from './ChartLegend';
import { useEffect, useRef, useState } from 'react';
import BarChart from './D3Chart';
import styled from '@emotion/styled';
import { colorScales } from 'theme';
import { useSearch } from 'api';
import { isAgg, stableSort } from 'app/sort';
import { useYears } from 'api';

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
  const [ query, setQuery ] = useQuery();
  const [ , setDialogQuery ] = useGrantsDialogQuery();

  // TODO reimplement this?
  // const { counts, amounts } = useAppSelector(getLegendFilters);
  const { data } = useSearch(query, {
    query: {
      select: ({ data }) => ({
        chartData: data.per_year.map(({ key, divisions }) => ({
          year: key,
          aggs: Object.fromEntries(stableSort(divisions, query.sort, query.direction)
            .map(({ key, ...aggs }) => [ key, aggs ])
          )
        })),
        divDomain: data.overall.map(d => d.key).filter(key => query.divisions.includes(key))
      }),
    }
  });
  
  const { data: yearData } = useYears(query, {
    query: {
      select: ({ data }) => (
        data.per_year.map(agg => ({ ...agg, year: agg.key }))
      )
    }
  });

  // const highlightedDivision = useAppSelector(getHighlightedDivision);
  const [ tooltipProps, setTooltipProps ] = useState<TooltipProps>({});

  // update colors globally with new domain
  // TODO why are colors not persistent
  //   useEffect(() => {
  //     Object.values(colorScales).forEach(s => s.domain(divisions.map(d => d.key)));
  //   }, [vis]);

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
    if (data && vis) {
      console.log(query.sort);
      if (isAgg(query.sort)) {
        vis.update(data.chartData, data.divDomain, query.sort);
      } else {
        vis.update(data.chartData, data.divDomain);
      }
      if (query.start && query.end) {
        vis.timeline.setYearRange(query.start, query.end);
      }
    }
  }, [vis, query.sort, data]);
  
  // update timeline on year change
  useEffect(() => {
    if (yearData && vis) {
      if (isAgg(query.sort)) {
        vis.timeline.update(yearData, query.sort);
      } else {
        vis.timeline.update(yearData);
      }
    }
  }, [vis, query.sort, yearData]);
  
  // update bar styles on highlight
  // useEffect(() => {
  //   vis?.highlightGroup(highlightedDivision);
  // }, [highlightedDivision]);

  // update chart on window resize
  useEffect(() => {
    if (props.height) vis.measure(props.width, props.height);
  }, [props.width, props.height]);

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
    setDialogQuery({
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
