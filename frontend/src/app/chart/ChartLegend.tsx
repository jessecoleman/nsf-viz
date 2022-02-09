import { FormControlLabel, styled, Radio, RadioGroup, Menu, IconButton, ListItem, ListItemIcon } from '@material-ui/core';
import { AttachFile, AttachMoney, InsertDriveFile, Settings } from '@mui/icons-material';
import { useQuery } from 'app/query';
import { SortableKeys } from 'app/sort';
import { ChangeEvent, useState, MouseEvent } from 'react';


const StyledMenu = styled(Menu)(({ theme }) => `
  transform: translate(-8px, -8px);
  & .MuiPaper-root {
    & .MuiList-root {
      & > div {
        padding: ${theme.spacing(1, 2)};
        display: flex;
        flex-direction: row;
      }
    }
  }
`);

const Label = styled('div')`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const units = [
  {
    value: 'count',
    label: 'Grants',
    icon: InsertDriveFile
  },
  {
    value: 'amount',
    label: 'Amounts',
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

const ChartLegend = () => {
  
  const [ query, setQuery ] = useQuery();
  const [ anchor, setAnchor ] = useState<HTMLElement | null>(null);

  const handleChangeAgg = (e: ChangeEvent) => {
    const { value } = e.currentTarget as HTMLInputElement;
    setQuery({ sort: value as SortableKeys });
  };
  
  const handleChangeBool = (e: ChangeEvent) => {
    const { value } = e.currentTarget as HTMLInputElement;
    setQuery({
      intersection: value === 'all'
    });
  };

  const handleToggle = (e: MouseEvent) => {
    setAnchor(anchor ? null : e.currentTarget as HTMLElement);
  };

  return (
    <>
      <IconButton
        id='legend'
        onClick={handleToggle}
      >
        <Settings />
      </IconButton>
      <StyledMenu
        open={!!anchor}  
        anchorEl={anchor}
        onClose={handleToggle}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <ListItem>
          <ListItemIcon>
            <Settings />
          </ListItemIcon>
          Chart Settings
        </ListItem>
        <div>
          <RadioGroup
            aria-label='aggregate toggle'
            name='aggregate'
            value={query.sort}
          >
            {units.map(u => (
              <FormControlLabel 
                key={u.value}
                value={u.value}
                control={
                  <Radio
                    color='primary'
                    onChange={handleChangeAgg}
                  />}
                label={<Label><u.icon fontSize='small' />{u.label}</Label>}
              />
            ))}
          </RadioGroup>
          <RadioGroup
            aria-label='intersection toggle'
            name='intersection'
            value={query.intersection ? 'all' : 'any'}
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
        </div>
      </StyledMenu>
    </>
  );
};

export default ChartLegend;