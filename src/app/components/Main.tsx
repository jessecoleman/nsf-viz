import React from 'react';
import { Theme, makeStyles } from '@material-ui/core/styles';
import { Paper, Grid } from '@material-ui/core';

import DivisionTable from 'app/components/DivisionTable';
import Cells from 'app/components/Cells';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    padding: theme.spacing(2),
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  }
}));

const Main: React.FC = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Grid container spacing={1}>
        <Grid item xs={12} md={4}>
          <DivisionTable />
        </Grid>
        <Grid item xs={12} md={8}>
          <Cells percent={false} />
        </Grid>
        <Grid item xs={12}>
Developed by Jesse Chamberlin, Peter Li, Jevin West at the University of Washington DataLab, and Chris Mentzel at the Moore Foundation 
        </Grid>
      </Grid>
    </div>
  );
}

export default Main;
