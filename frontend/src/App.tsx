import NavigationBar from 'app/nav/NavigationBar';
import { Box, styled } from '@material-ui/core';
import DivisionDrawer from 'app/nav/Drawer';
import Footer from 'app/nav/Footer';
import Chart from 'app/chart/Chart';
import { useMeasureChart } from 'app/hooks';
import Actions from 'app/nav/Actions';
import GrantsDialog from 'app/grants/GrantsDialog';

const ResponsiveContainer = styled('div')(({ theme }) => `
  overflow: clip;
  height: 100vh;
  display: flex;
  flex-direction: column;
  ${theme.breakpoints.up('md')} {
    margin-left: ${theme.drawerWidth};
  }
`);

const App = () => {

  const [ navbarRef, dims ] = useMeasureChart<HTMLDivElement>();

  return (
    <Box
      display='flex'
      flexDirection='column'
    >
      <DivisionDrawer />
      <ResponsiveContainer>
        <NavigationBar ref={navbarRef} />
        <Chart {...dims} />
        <Footer />
        <Actions />
      </ResponsiveContainer>
      <GrantsDialog />
    </Box>
  );
};

export default App;
