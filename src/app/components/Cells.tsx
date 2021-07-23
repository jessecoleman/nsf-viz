import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import useDimensions from 'react-use-dimensions';

import * as d3 from 'd3';

import { BarStack } from '@vx/shape';
import { Group } from '@vx/group';
import { AxisLeft, AxisBottom } from '@vx/axis';
import { ScaleBand, ScaleLinear, ScaleOrdinal } from '@vx/axis';
import { withTooltip, Tooltip } from '@vx/tooltip';


import { green, lightGreen, teal } from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/core';

import { getData } from 'app/actions';
import Chart from 'app/components/Chart';

const cells = [
  {
  getTitle: (p) => 'Grants in SELECTED divisions per year ' + (p ? '(%)' : '(#)'),
  tip: (v, p, name, norm) => (
    <table className='striped'>
    <tbody>
      <tr>
      <td>SELECTED divisions</td>
      <td>{(p ? d3.format('.2%')(norm) : d3.format(',')(norm) + ' grants')}</td>
      </tr>
      <tr>
      <td>{name}</td>
      <td>{(p ? d3.format('.2%')(v) : d3.format(',')(v) + ' grants')}</td>
      </tr>
    </tbody>
    </table>
  ),
  tick: (p) => p ? d3.format('.2%') : d3.format('.2s'),
  amount: false,
  filtered: true,
  value: (value, key, norm=1) => {
    if (value[key]) {
    return value[key].match_grants / norm;
    } else {
    return 0;
    }
  }
  },
    {
    getTitle: (p) => 'ALL grants per year ' + (p ? '(%)' : '(#)'),
    tip: (v, p) => {
      return `<span style='padding: 8px'>
      ${p ? d3.format('.2%')(v) : d3.format(',')(v) + ' grants'}
      </span>`;
    },
    tick: (p) => p ? d3.format('.2%') : d3.format('.2s'),
    amount: false,
    filtered: false,
    value: (value, key, norm=1) => {
      if (value[key]) {
      return value[key].match_grants / norm;
      } else {
      return 0;
      }
    }
    },
    {
    getTitle: (p) => 'Grant funding in SELECTED divisions per year ' + (p ? '(%)' : '($)'),
    tip: (v, p, name, norm) => {
      return `<table class='striped'>
      <tbody>
        <tr>
        <td>SELECTED divisions</td>
        <td>${(p ? d3.format('.2%')(norm) : d3.format('$,')(norm))}</td>
        </tr>
        <tr>
        <td>${name}</td>
        <td>${(p ? d3.format('.2%')(v) : d3.format('$,')(v))}</td>
        </tr>
      </tbody>
      </table>`;
    },
    tick: (p) => p ? d3.format('.2%') : d3.format('$.2s'),
    amount: true,
    filtered: true,
    value: (value, key, norm=1) => {
      if (value[key]) {
      return value[key].match_amount / norm;
      } else {
      return 0;
      }
    }
    },
    {
    getTitle: (p) => 'ALL grant funding per year ' + (p ? '(%)' : '($)'),
    tip: (v, p) => {
      return `<span style='padding: 8px'>
      ${p ? d3.format('.2%')(v) : d3.format('$,')(v)}
      </span>`;
    },
    tick: (p) => p ? d3.format('.2%') : d3.format('$.2s'),
    amount: true,
    filtered: false,
    value: (value, key, norm=1) => {
      if (value[key]) {
      return value[key].match_amount / norm;
      } else {
      return 0;
      }
    }
  },
]

const useStyles = makeStyles(theme => ({
  container: {
    width: '100%',
    height: '100%',
  }
}));

const Charts: React.FC<{
  percent: boolean,
}> = (props) => {

  const classes = useStyles();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getData());
  }, [dispatch]);

  const [ ref, { width, height } ] = useDimensions();

  const perYear = useSelector(state => state.data.perYear);
  const perDivision = useSelector(state => state.data.perDivision);
  const total = useSelector(state => state.data.sumTotal);

  if (!perYear) return null;

  //{cells.map((c, i) => (
  const c = cells[0];
  return (
    <div ref={ref} className={classes.container}>
      {width && height &&
        <Chart
          width={width}
          height={height}
          title={c.getTitle(props.percent)}
          percent={props.percent}
          amount={c.amount}
          filtered={c.filtered}
          hue={c.amount ? green : teal}
          perYear={perYear}
          perDivision={perDivision}
          divisions={total.divisions.buckets}
        />
      }
    </div>
  );
}

export default Charts;
