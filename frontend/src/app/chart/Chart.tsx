import { useEffect } from 'react';
import { useMemoOne } from 'use-memo-one';
import * as d3 from 'd3';
import { green, deepPurple } from '@material-ui/core/colors';

import { BarChart, CartesianGrid, XAxis, YAxis, Bar, ResponsiveContainer, Tooltip, Brush, Legend } from 'recharts';
import { getDivisions, getLegendFilters, getPerDivision } from 'app/selectors';
import { useAppDispatch, useAppSelector } from 'app/store';
import useConstant, { useQuery } from 'app/hooks';
import { format } from 'd3';

import ChartTooltip from './ChartTooltip';
import { loadData } from 'app/actions';
import ChartLegend from './ChartLegend';
import { setGrantDialogOpen, setGrantFilter } from 'app/filterReducer';
import { clearGrants } from 'app/dataReducer';

const greenScale = d3.scaleOrdinal(Object.values(green).slice(2, -3));
const deepPurpleScale = d3.scaleOrdinal(Object.values(deepPurple).slice(2, -3));

const Chart = () => {

  const dispatch = useAppDispatch();
  const query = useQuery();

  useEffect(() => {
    dispatch(loadData(query));
  }, [dispatch]);

  const { counts, amounts } = useAppSelector(getLegendFilters);
  const perDivision = useAppSelector(getPerDivision);
  const divisions = useAppSelector(getDivisions);

  const handleChangeBrush = (e: any) => {
    // console.log(e.startIndex, e.endIndex);
  };

  const handleClick = e => {
    if (e) {
      console.log(e);
      dispatch(clearGrants());
      dispatch(setGrantFilter({ year: e.activeLabel }));
      dispatch(setGrantDialogOpen(true));
    }
  };

  const handleMouseLeave = e => {
    // pass
  };

  const handleMouseMove = e => {
    // pass
  };
  
  const data = useMemoOne(() => perDivision.map((yearBucket, idx) => ({
    year: +yearBucket.key_as_string!,
    v: idx,
    ...query.divisions.reduce((obj, key) => {
      const div = yearBucket.divisions.buckets.find(d => d.key === key);
      obj[`${key}-count`] = div?.doc_count ?? 0;
      obj[`${key}-amount`] = div?.grant_amounts.value ?? 0;
      return obj;
    }, {}),
    // ...yearBucket.divisions.buckets.reduce((obj, d) => {
    //   obj[`${divisionsMap[d.key]}-count`] = d.doc_count;
    //   obj[`${divisionsMap[d.key]}-amount`] = d.grant_amounts.value;
    //   return obj;
    // }, {}),
  })), [JSON.stringify(perDivision), JSON.stringify(query.divisions)]);
  
  greenScale.domain(divisions.map(d => d.key));
  deepPurpleScale.domain(divisions.map(d => d.key));

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
        {counts && query.divisions.map(key => (
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
        {amounts && query.divisions.map(key => (
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
