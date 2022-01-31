import { ChangeEvent } from 'react';
import { Box, Input, InputAdornment, ListItemIcon, MenuItem, Select, SelectChangeEvent, styled } from '@material-ui/core';
import { Close, FilterList } from '@mui/icons-material';

import DrawerToggle from 'app/nav/DrawerToggle';
import nih from '../images/nih-logo.svg';
import nsf from '../images/nsf-logo.svg';
import dod from '../images/dod-logo.svg';
import { Organization } from 'app/query';

const Toolbar = styled('div')(({ theme }) => `
  display: flex;
  flex-direction: column;
  padding: ${theme.spacing(2)};
  & .MuiInput-root {
    padding-top: ${theme.spacing(2)}
  }
`);

const StyledSelect = styled(Select)(({ theme }) => `
  & .MuiSelect-select {
    display: flex;
    align-items: center;
    font-size: 1.2em;
    padding: ${theme.spacing(1.5)};
  }
`) as unknown as typeof Select; // bleck!
  
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
  org: Organization
  filter: string
  numSelected: number
  onChangeOrg: (e: SelectChangeEvent<Organization>) => void
  onChangeFilter: (e: ChangeEvent<HTMLInputElement>) => void
}

const orgs = [
  { title: 'National Science Foundation', abbr: 'nsf', src: nsf },
  { title: 'National Institute of Health', abbr: 'nih', src: nih },
  { title: 'Department of Defense', abbr: 'dod', src: dod}
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