import * as d3 from 'd3';
import { green } from '@material-ui/core/colors';

import { BarChart, CartesianGrid, XAxis, YAxis, Bar, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getDivisions, getPerDivision } from 'app/selectors';
import { useAppSelector } from 'app/store';

type ChartProps = {
  title: string,
  percent: boolean,
  //value: string,
  amount: boolean,
  filtered: boolean,
  hue: Record<number | string, string>,
}

const Chart = (props: ChartProps) => {

  const perYear = useAppSelector(getPerDivision)?.years.buckets;
  const perDivision = useAppSelector(getPerDivision)?.years.buckets;
  const divisions = useAppSelector(getDivisions);
  
  if (!(perYear && perDivision)) return null;

  const handleClick = e => {
    console.log(e);
  };

  const handleMouseLeave = e => {
    // pass
  };

  const handleMouseMove = e => {
    // pass
  };

  const data = perDivision.map((b, idx) => ({
    year: +b.key_as_string,
    v: idx,
    ...b.divisions.buckets.reduce((obj, d) => {
      obj[d.key] = d.doc_count;
      return obj;
    }, {}),
  }));

  const color = d3.scaleOrdinal(Object.values(green).slice(2, -3))
    .domain(divisions.map(d => d.title));

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
        {divisions.filter(d => !props.filtered || d.selected).map(d => (
          <Bar
            key={d.title}
            dataKey={d.title}
            stackId='a'
            fill={color(d.title)}
            name={d.title}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default Chart;
