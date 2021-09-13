import { IconButton, styled } from '@material-ui/core';
import { useDrawer } from 'app/hooks';


const ResponsiveButton = styled(IconButton)(({ theme }) => `
  ${theme.breakpoints.up('md')} {
    display: none;
  }
`);
        
const DrawerToggle = (props: { children: JSX.Element }) => {

  const [ , handleToggle ] = useDrawer();
  
  return (
    <ResponsiveButton onClick={handleToggle}>
      {props.children}
    </ResponsiveButton>
  );
};

export default DrawerToggle;
