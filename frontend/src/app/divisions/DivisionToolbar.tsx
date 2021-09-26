import { ChangeEvent } from 'react';
import { Box, FormControl, Input, InputAdornment, ListItemIcon, MenuItem, Select, SelectChangeEvent, styled } from '@material-ui/core';
import { Close, FilterList } from '@material-ui/icons';

import DrawerToggle from 'app/nav/DrawerToggle';
import nih from '../images/nih-logo.svg';
import nsf from '../images/nsf-logo.svg';

const Toolbar = styled('div')(({ theme }) => `
  display: flex;
  flex-direction: column;
  padding: ${theme.spacing(2)};
  & .MuiInput-root {
    padding-top: ${theme.spacing(2)}
  }
`);

const StyledSelect = styled(Select)`
  & .MuiSelect-select {
    display: flex;
    align-items: center;
  }
` as unknown as typeof Select;
  
const Actions = styled('div')(({ theme }) => `
  color: ${theme.palette.text.secondary};
`);

const Logo = styled('img')`
  width: 2em;
  height: 2em;
  filter: brightness(30%);
  margin-right: 24px;
`;

type DivisionToolbarProps = {
  org: string
  filter: string
  numSelected: number
  onChangeOrg: (e: SelectChangeEvent<string>) => void
  onChangeFilter: (e: ChangeEvent<HTMLInputElement>) => void
}

const orgs = [
  { title: 'National Science Foundation', abbr: 'nsf', src: nsf },
  { title: 'National Institute of Health', abbr: 'nih', src: nih } 
];

const DivisionToolbar = (props: DivisionToolbarProps) => (
  <Toolbar>
    <StyledSelect
      value={props.org}
      onChange={props.onChangeOrg}
    >
      {orgs.map(o => (
        <MenuItem key={o.abbr} value={o.abbr}>
          <ListItemIcon>
            <Logo src={o.src} />
          </ListItemIcon>
          {o.title}
        </MenuItem>
      ))}
    </StyledSelect>
    <Input
      placeholder='filter divisions'
      value={props.filter}
      onChange={props.onChangeFilter}
      startAdornment={
        <InputAdornment position='start'>
          <FilterList />
        </InputAdornment>
      }
    />
    <Box flexGrow={1} />
    <Actions>
      <DrawerToggle>
        <Close />
      </DrawerToggle>
    </Actions>
  </Toolbar>
);

export default DivisionToolbar;