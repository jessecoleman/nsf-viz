import { Drawer, useMediaQuery } from '@material-ui/core';
import { styled } from '@material-ui/core';
import DivisionTable from 'app/divisions/DivisionTable';
import { useDrawer } from 'app/hooks';
    
const Container = styled('nav')(({ theme }) => `
  & .MuiDrawer-paper {
    width: ${theme.drawerWidth};
    ${theme.breakpoints.down('sm')} {
      width: 100%;
    }
  }
`);

const DivisionDrawer = () => {
  
  const matches = useMediaQuery('(min-width:960px)');
  const [ open, handleToggle ] = useDrawer();
 
  return (
    <Container aria-label='divisions filter'>
      <Drawer
        container={window.document.body}
        variant={matches ? 'permanent' : 'temporary'}
        anchor='left' //{theme.direction === 'rtl' ? 'right' : 'left'}
        open={matches || open}
        onClose={handleToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
      >
        <DivisionTable />
      </Drawer>
    </Container>
  );
};

export default DivisionDrawer;