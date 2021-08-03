import React, { useEffect } from 'react';
import useDimensions from 'react-use-dimensions';

import * as d3 from 'd3';

import { green, lightGreen, teal } from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/core';

import { loadData } from 'app/actions';
import Chart from 'app/components/Chart';
import { getPerDivision, getTotal } from 'app/selectors';
import { useAppDispatch, useAppSelector } from 'app/store';

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
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadData());
  }, [dispatch]);

  const [ ref, { width, height } ] = useDimensions();

  const total = useAppSelector(getTotal);

  //{cells.map((c, i) => (
  const c = cells[0];
  return (
    <div ref={ref} className={classes.container}>
      {total && width && height &&
        <Chart
          width={width}
          height={height}
          title={c.getTitle(props.percent)}
          percent={props.percent}
          amount={c.amount}
          filtered={c.filtered}
          hue={c.amount ? green : teal}
          divisions={total.divisions.buckets}
        />
      }
    </div>
  );
}

export default Charts;
