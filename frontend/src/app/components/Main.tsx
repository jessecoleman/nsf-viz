import React from 'react';
import { styled } from '@material-ui/core/styles';
import { Grid } from '@material-ui/core';

import DivisionTable from 'app/divisions/DivisionTable';
import Chart from 'app/chart/Chart';

const Container = styled('div')(({ theme }) => `
  height: calc(100% - 64px);
  padding: ${theme.spacing(2)};
  flex-grow: 1;
`);

const Main = () => {

  return (
    <Container>
      <Grid container spacing={1}>
        <Grid item xs={12} md={4}>
          <DivisionTable />
        </Grid>
        <Grid item xs={12} md={8}>
          <Chart />
        </Grid>
        <Grid item xs={12}>
Developed by Jesse Chamberlin, Peter Li, Jevin West at the University of Washington DataLab, and Chris Mentzel at the Moore Foundation 
        </Grid>
      </Grid>
    </Container>
  );
};

export default Main;
