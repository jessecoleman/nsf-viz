import { Checkbox, Paper, FormGroup, FormControlLabel, styled } from '@material-ui/core';


const Container = styled(Paper)(({ theme }) => `
  padding: ${theme.spacing(1, 2)};
  width: 8em;
`);

const ChartLegend = (props: any) => {
  console.log(props);
  return (
    <Container>
      <FormGroup>
        <FormControlLabel 
          control={<Checkbox color='primary' />}
          label='Counts'
        />
        <FormControlLabel 
          control={<Checkbox color='secondary' />}
          label='Amounts'
        />
      </FormGroup>
    </Container>
  );
};

export default ChartLegend;