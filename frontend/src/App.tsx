import NavigationBar from 'app/nav/NavigationBar';
import { Box, styled } from '@material-ui/core';
import DivisionDrawer from 'app/nav/Drawer';
import Footer from 'app/nav/Footer';
import Chart from 'app/chart/Chart';

const ResponsiveContainer = styled('div')(({ theme }) => `
  height: 100vh;
  display: flex;
  flex-direction: column;
  ${theme.breakpoints.up('md')} {
    margin-left: ${theme.drawerWidth};
  }
`);

const App = () => {
  
  return (
    <Box
      display='flex'
      flexDirection='column'
    >
      <DivisionDrawer />
      <ResponsiveContainer>
        <NavigationBar />
        <Chart />
        { /*<Footer /> */ }
      </ResponsiveContainer>
    </Box>
  );
};

export default App;
