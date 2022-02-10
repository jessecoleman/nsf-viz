import { Icon, IconButton, styled } from '@material-ui/core';
import { BarChart } from '@mui/icons-material';
import { BooleanParam, useQueryParam } from 'use-query-params';
import filter from '../images/filter-divisions.svg';


const ResponsiveButton = styled(IconButton)(({ theme }) => `
  ${theme.breakpoints.up('md')} {
    display: none;
  }
`);
        
const DrawerToggle = () => {

  const [ drawerOpen, setDrawerOpen ] = useQueryParam('drawer', BooleanParam);
  
  return (
    <ResponsiveButton onClick={() => setDrawerOpen(!drawerOpen)}>
      {drawerOpen 
        ? <BarChart />
        : <Icon color='inherit'><img src={filter} /></Icon>
      }     
    </ResponsiveButton>
  );
};

export default DrawerToggle;
