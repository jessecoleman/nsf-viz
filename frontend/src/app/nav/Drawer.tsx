import { Drawer, useMediaQuery } from '@material-ui/core';
import { styled } from '@material-ui/core';
import DirectoryTree from 'app/divisions/DirectoryTree';
import { useDrawer } from 'app/hooks';
    
const Container = styled('nav')(({ theme }) => `
  & .MuiDrawer-paper {
    width: ${theme.drawerWidth};
    display: flex;
    flex-direction: column;
    ${theme.breakpoints.down('sm')} {
      width: 100%;
    }
  }
`);

const DivisionDrawer = () => {
  
  const wideScreen = useMediaQuery('(min-width:960px)');
  const [ open, handleToggle ] = useDrawer();
 
  return (
    <Container aria-label='divisions filter'>
      <Drawer
        container={window.document.body}
        variant={wideScreen ? 'permanent' : 'temporary'}
        anchor='left'
        open={wideScreen || open}
        onClose={handleToggle}
        ModalProps={{
          keepMounted: true
        }}
      >
        <DirectoryTree />
      </Drawer>
    </Container>
  );
};

export default DivisionDrawer;