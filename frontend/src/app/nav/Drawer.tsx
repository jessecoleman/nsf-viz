import { Drawer, useMediaQuery } from '@mui/material';
import { styled } from '@mui/material';

import { BooleanParam, useQueryParam } from 'use-query-params';

import DirectoryTree from 'app/divisions/DirectoryTree';

const Container = styled('nav')(
  ({ theme }) => `
  & .MuiDrawer-paper {
    width: ${theme.drawerWidth};
    display: flex;
    flex-direction: column;
    ${theme.breakpoints.down('md')} {
      width: 100%;
    }
  }
`
);

const DivisionDrawer = () => {
  const wideScreen = useMediaQuery('(min-width:960px)');
  console.log(wideScreen);
  const [drawerOpen, setDrawerOpen] = useQueryParam('drawer', BooleanParam);

  return (
    <Container aria-label='divisions filter'>
      <Drawer
        variant={wideScreen ? 'persistent' : 'temporary'}
        anchor='left'
        open={wideScreen || !!drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{
          keepMounted: true,
        }}
      >
        <DirectoryTree />
      </Drawer>
    </Container>
  );
};

export default DivisionDrawer;
