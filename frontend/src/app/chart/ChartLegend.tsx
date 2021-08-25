import { Checkbox, Paper, FormGroup, FormControlLabel, styled, Radio, RadioGroup } from '@material-ui/core';
import { AttachFile, AttachMoney, InsertDriveFile } from '@material-ui/icons';
import { setLegendFilters } from 'app/filterReducer';
import { getLegendFilters } from 'app/selectors';
import { useAppDispatch, useAppSelector } from 'app/store';
import { ChangeEvent } from 'react';


const Container = styled(Paper)(({ theme }) => `
  padding: ${theme.spacing(1, 2)};
  width: 14em;
    display: flex;
    flex-direction: row;
`);

const Label = styled('div')(({ theme }) => `
  display: flex;
  flex-direction: row;
  align-items: center;
`);

const ChartLegend = () => {
  
  const dispatch = useAppDispatch();
  const { counts, amounts } = useAppSelector(getLegendFilters);

  const handleChangeFilters = (e: ChangeEvent, checked: boolean) => {
    console.log(e, checked);
    const { name } = e.currentTarget as HTMLInputElement;
    dispatch(setLegendFilters({
      [name]: checked
    }));
  };

  return (
    <Container>
      <FormGroup>
        <FormControlLabel 
          control={
            <Checkbox
              name='counts'
              color='primary'
              checked={counts}
              onChange={handleChangeFilters}
            />}
          label={<Label><InsertDriveFile fontSize='small'/>Grants</Label>}
        />
        <FormControlLabel 
          control={
            <Checkbox
              name='amounts'
              color='secondary'
              checked={amounts}
              onChange={handleChangeFilters}
            />
          }
          label={<Label><AttachMoney fontSize='small'/>Award</Label>}
        />
      </FormGroup>
      <RadioGroup
        aria-label='bool toggle'
        name='boolToggle'
      >
        <FormControlLabel 
          value='any'
          control={<Radio color='primary' />}
          label='Any'
        />
        <FormControlLabel 
          value='all'
          control={<Radio color='primary' />}
          label='All'
        />
      </RadioGroup>
    </Container>
  );
};

export default ChartLegend;