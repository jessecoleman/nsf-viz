import * as d3 from 'd3';
import { green, deepPurple } from '@material-ui/core/colors';

import { BarChart, CartesianGrid, XAxis, YAxis, Bar, ResponsiveContainer, Tooltip, Brush, Legend } from 'recharts';
import { getDivisionAggs, getLegendFilters, getSelectedTerms, getStackedData } from 'app/selectors';
import { useAppDispatch, useAppSelector } from 'app/store';
import { useQuery } from 'app/hooks';
import { format } from 'd3';

import ChartTooltip from './ChartTooltip';
import ChartLegend from './ChartLegend';
import { setGrantDialogOpen, setGrantFilter } from 'app/filterReducer';
import { clearGrants } from 'app/dataReducer';
import { loadData } from 'app/actions';
import { useEffect, useRef } from 'react';
import D3Component from './D3Chart';

export const interleave = <T extends unknown>(v: T, i: number, a: T[]) => (
  a[Math.trunc(i / 2) + (i % 2 ? a.length / 2 : 0)]
);
const greens = Object.values(green).slice(0, -4).map(interleave);
export const greenScale = d3.scaleOrdinal(greens);
const purples = Object.values(deepPurple).slice(0, -4).map(interleave);
export const deepPurpleScale = d3.scaleOrdinal(purples);

let vis: D3Component;

const Chart = () => {

  const visRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const query = useQuery();

  const { counts, amounts } = useAppSelector(getLegendFilters);
  // const perDivision = useAppSelector(getPerDivision);
  const data = useAppSelector(state => getStackedData(state, query.divisions));
  const divisions = useAppSelector(getDivisionAggs);
  const selectedTerms = useAppSelector(getSelectedTerms);
  const { bool } = useAppSelector(getLegendFilters);

  useEffect(() => {
    if (visRef.current && !vis) {
      console.log(visRef);
      vis = new D3Component(visRef.current, {
        data,
      });
    }
  }, [visRef.current, visRef.current?.clientHeight]);
  
  useEffect(() => {
    if (data.length) {
      const divDomain = query.divisions; //.sort(comparator);
      vis.update(data, divDomain);
    }
  }, [JSON.stringify(data)]);

  useEffect(() => {
    dispatch(loadData(query));
  }, [JSON.stringify([selectedTerms.length ? selectedTerms : query.terms, bool ])]);

  const handleChangeBrush = (e: any) => {
    // console.log(e.startIndex, e.endIndex);
  };

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

  const handleMouseLeave = e => {
    // pass
  };

  const handleMouseMove = e => {
    // pass
  };
  
  const divMap = Object.fromEntries(divisions.map(d => [d.key, d.count]));
  const comparator = (a: string, b: string) => divMap[b] - divMap[a];

  const divDomain = query.divisions.sort(comparator);
  greenScale.domain(divDomain);
  deepPurpleScale.domain(divDomain);
  
  return (
    <div style={{ padding: '16px', height: '100%' }} ref={visRef} />
  );

  return (
    <ResponsiveContainer width='100%' aspect={1.5}>
      <BarChart
        data={data}
        onClick={handleClick}
      >
        <CartesianGrid strokeDasharray='2 2' />
        <XAxis
          dataKey='year'
          domain={[2005, 2018]}
          tickCount={13}
          interval={0}
        />
        <YAxis
          yAxisId='amount'
          orientation='right'
          tickFormatter={format('$.2s')}
        />
        <YAxis yAxisId='count' />
        <Tooltip<number, string>
          content={(props) => <ChartTooltip {...props} />}
        />
        {counts && divDomain.map(key => (
          <Bar
            key={`${key}-count`}
            yAxisId='count'
            dataKey={`${key}-count`}
            stackId='count'
            fill={deepPurpleScale(key)}
            name={`${key}-count`}
            onClick={handleClick}
          />
        ))}
        {amounts && divDomain.map(key => (
          <Bar
            key={`${key}-amount`}
            yAxisId='amount'
            dataKey={`${key}-amount`}
            stackId='amount'
            fill={greenScale(key)}
            name={`${key}-amount`}
            onClick={handleClick}
          />
        ))}
        <Brush
          dataKey='year'
          onChange={handleChangeBrush}
        />
        <Legend
          align='left'
          verticalAlign='top'
          content={<ChartLegend />}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default Chart;
