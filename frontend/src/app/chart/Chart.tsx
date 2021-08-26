import { useEffect } from 'react';
import * as d3 from 'd3';
import { green, deepPurple } from '@material-ui/core/colors';

import { BarChart, CartesianGrid, XAxis, YAxis, Bar, ResponsiveContainer, Tooltip, Brush, Legend } from 'recharts';
import { getDivisions, getDivisionsMap, getLegendFilters, getPerDivision } from 'app/selectors';
import { useAppDispatch, useAppSelector } from 'app/store';
import { useQuery } from 'app/hooks';
import { format } from 'd3';

import ChartTooltip from './ChartTooltip';
import { loadData } from 'app/actions';
import ChartLegend from './ChartLegend';


const Chart = () => {

  const dispatch = useAppDispatch();
  const query = useQuery();

  useEffect(() => {
    dispatch(loadData(query));
  }, [dispatch]);

  const { counts, amounts } = useAppSelector(getLegendFilters);
  const perYear = useAppSelector(getPerDivision);
  const perDivision = useAppSelector(getPerDivision);
  const divisionsMap = useAppSelector(getDivisionsMap);
  const divisions = useAppSelector(getDivisions);
  
  if (!(perYear && perDivision)) return null;

  const handleChangeBrush = (e: any) => {
    // console.log(e.startIndex, e.endIndex);
  };

  const handleClick = e => {
    // pass
  };

  const handleMouseLeave = e => {
    // pass
  };

  const handleMouseMove = e => {
    // pass
  };

  const data = perDivision.map((b, idx) => ({
    year: +b.key_as_string!,
    v: idx,
    ...b.divisions.buckets.reduce((obj, d) => {
      obj[`${divisionsMap[d.key]}-count`] = d.doc_count;
      obj[`${divisionsMap[d.key]}-amount`] = d.grant_amounts.value;
      return obj;
    }, {}),
  }));

  const selectedDivisions = new Set(query.divisions);

  const greenScale = d3.scaleOrdinal(Object.values(green).slice(2, -3))
    .domain(divisions.map(d => d.key));

  const deepPurpleScale = d3.scaleOrdinal(Object.values(deepPurple).slice(2, -3))
    .domain(divisions.map(d => d.key));

  const filteredDivisions = divisions.filter(d => selectedDivisions.has(d.key));

  return (
    <ResponsiveContainer width='100%' aspect={1.5}>
      <BarChart data={data}>
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
        {counts && filteredDivisions.map(d => (
          <Bar
            key={`${d.key}-count`}
            yAxisId='count'
            dataKey={`${d.key}-count`}
            stackId='count'
            fill={deepPurpleScale(d.key)}
            name={`${d.name}-count`}
          />
        ))}
        {amounts && filteredDivisions.map(d => (
          <Bar
            key={d.key}
            yAxisId='amount'
            dataKey={`${d.key}-amount`}
            stackId='amount'
            fill={greenScale(d.key)}
            name={`${d.name}-amount`}
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
