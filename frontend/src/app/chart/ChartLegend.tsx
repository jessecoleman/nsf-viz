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

const Label = styled('div')`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const ChartLegend = () => {
  
  const dispatch = useAppDispatch();
  const { counts, amounts, bool } = useAppSelector(getLegendFilters);

  const handleChangeFilters = (e: ChangeEvent, checked: boolean) => {
    const { name } = e.currentTarget as HTMLInputElement;
    dispatch(setLegendFilters({
      [name]: checked
    }));
  };
  
  const handleChangeBool = (e: ChangeEvent) => {
    const { value } = e.currentTarget as HTMLInputElement;
    dispatch(setLegendFilters({
      bool: value
    }));
  };

  const units = [
    {
      value: 'counts',
      label: 'Grants',
      checked: counts,
      icon: InsertDriveFile
    },
    {
      value: 'amounts',
      label: 'Amounts',
      checked: amounts,
      icon: AttachMoney,
    }
  ];

  const radio = [
    {
      value: 'any',
      label: 'Any',
    },
    {
      value: 'all',
      label: 'All',
    }
  ];

  return (
    <Container id='legend'>
      {/*<FormGroup>
        {units.map(u => (
          <FormControlLabel 
            key={u.value}
            control={
              <Checkbox
                name={u.value}
                color='primary'
                checked={u.checked}
                onChange={handleChangeFilters}
              />}
            label={<Label><u.icon fontSize='small' />{u.label}</Label>}
          />
        ))}
        </FormGroup> */}
      <RadioGroup
        aria-label='bool toggle'
        name='boolToggle'
        value={bool}
      >
        {radio.map(r => (
          <FormControlLabel 
            key={r.value}
            value={r.value}
            control={
              <Radio
                color='primary'
                onChange={handleChangeBool}
              />
            }
            label={r.label}
          />
        ))}
      </RadioGroup>
    </Container>
  );
};

export default ChartLegend;