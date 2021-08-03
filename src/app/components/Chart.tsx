import React from 'react';
import * as d3 from 'd3';
import { green, lightGreen, teal } from '@material-ui/core/colors';

import { BarChart, CartesianGrid, XAxis, YAxis, Bar, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { LineChart, Line } from 'recharts';
import { scaleBand, scaleLinear, scaleOrdinal } from '@vx/scale';
import { Bucket, Division, PerDivision, PerYear } from 'app/types';
import { getPerDivision, getTotal } from 'app/selectors';
import { useAppSelector } from 'app/store';

const MyBar = (props) => {
  console.log(props);
  return <rect {...props} x={0} width={4} />
}

const Chart: React.FC<{
  width: number,
  height: number,
  title: any,
  percent: boolean,
  //value: string,
  amount: boolean,
  filtered: boolean,
  hue: any,
  divisions: Bucket[],
}> = (props) => {

  const perYear = useAppSelector(getPerDivision)?.years.buckets;
  const perDivision = useAppSelector(getPerDivision)?.years.buckets;
  const total = useAppSelector(getTotal);
  
  if (!(perYear && perDivision)) return null;

  const handleClick = e => {
    console.log(e);
  }

  const handleMouseLeave = e => {

  }

  const handleMouseMove = e => {

  }

  const divisions = props.divisions.map(d => d.key);
  const data = perDivision.map((b, idx) => ({
    year: +b.key_as_string,
    v: idx,
    ...b.divisions.buckets.reduce((obj, d) => {
      obj[d.key] = d.doc_count;
      return obj;
    }, {}),
  }));

  const formatDate = date => d3.timeFormat('%Y%m%d')(d3.timeParse('%b %d')(date));

  const margin = { top: 10, left: 10, bottom: 10, right: 10 };

  const color = scaleOrdinal({
    domain: divisions,
    range: Object.values(green).slice(2, -3),
  });

  return (
    <ResponsiveContainer width='100%' height='100%'>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray='2 2' />
        <XAxis
          dataKey='year'
          //type='number'
          domain={[2005, 2018]}
          tickCount={13}
          interval={0}
        />
        <YAxis />
        <Tooltip />
        {divisions.map((d: string) => (
          <Bar
            key={d}
            dataKey={d}
            stackId='a'
            fill={color(d)}
            name={d}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

export default Chart;
