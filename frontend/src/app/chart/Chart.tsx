import { useMemoOne } from 'use-memo-one';
import * as d3 from 'd3';
import { green, deepPurple } from '@material-ui/core/colors';

import { BarChart, CartesianGrid, XAxis, YAxis, Bar, ResponsiveContainer, Tooltip, Brush, Legend } from 'recharts';
import { getDivisionAggs, getDivisions, getLegendFilters, getPerDivision, getSelectedTerms, getStackedData } from 'app/selectors';
import { useAppDispatch, useAppSelector } from 'app/store';
import { usePrevious, useQuery } from 'app/hooks';
import { format } from 'd3';

import ChartTooltip from './ChartTooltip';
import ChartLegend from './ChartLegend';
import { setGrantDialogOpen, setGrantFilter } from 'app/filterReducer';
import { clearGrants } from 'app/dataReducer';
import { loadData } from 'app/actions';
import { useEffect } from 'react';

const textScale = d3.scaleOrdinal(Array(4).fill('#000').concat(Array(4).fill('#fff')));
const greenScale = d3.scaleOrdinal(Object.values(green).slice(0, -4));
const deepPurpleScale = d3.scaleOrdinal(Object.values(deepPurple).slice(0, -4));

const Chart = () => {

  const dispatch = useAppDispatch();
  const query = useQuery();

  const { counts, amounts } = useAppSelector(getLegendFilters);
  // const perDivision = useAppSelector(getPerDivision);
  const data = useAppSelector(state => getStackedData(state, query.divisions));
  const divisions = useAppSelector(getDivisionAggs);
  const selectedTerms = useAppSelector(getSelectedTerms);
  const { bool } = useAppSelector(getLegendFilters);

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
  
  // const data = useMemoOne(() => perDivision.map((yearBucket, idx) => ({
  //   year: +yearBucket.key_as_string!,
  //   v: idx,
  //   ...query.divisions.reduce((obj, key) => {
  //     const div = yearBucket.divisions.buckets.find(d => d.key === key);
  //     obj[`${key}-count`] = div?.doc_count ?? 0;
  //     obj[`${key}-amount`] = div?.grant_amounts.value ?? 0;
  //     return obj;
  //   }, {}),
  // })), [JSON.stringify(perDivision), JSON.stringify(query.divisions)]);
  
  const divMap = Object.fromEntries(divisions.map(d => [d.key, d.count]));
  const comparator = (a, b) => divMap[b] - divMap[a];

  const divDomain = divisions.sort(comparator).map(d => d.key);
  greenScale.domain(divDomain);
  deepPurpleScale.domain(divDomain);
  textScale.domain(divDomain);

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
        {counts && query.divisions.sort(comparator).map(key => (
          <Bar
            // isAnimationActive={animate}
            key={`${key}-count`}
            yAxisId='count'
            dataKey={`${key}-count`}
            stackId='count'
            fill={deepPurpleScale(key)}
            color={textScale(key)}
            name={`${key}-count`}
            onClick={handleClick}
          />
        ))}
        {amounts && query.divisions.sort(comparator).map(key => (
          <Bar
            key={`${key}-amount`}
            yAxisId='amount'
            dataKey={`${key}-amount`}
            stackId='amount'
            fill={greenScale(key)}
            color={textScale(key)}
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
