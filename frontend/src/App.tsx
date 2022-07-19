import { Box, styled } from '@mui/material';

import Chart from 'app/chart/Chart';
import GrantsDialog from 'app/grants/GrantsDialog';
import { useMeasureChart } from 'app/hooks';
import Actions from 'app/nav/Actions';
import DivisionDrawer from 'app/nav/Drawer';
import Footer from 'app/nav/Footer';
import NavigationBar from 'app/nav/NavigationBar';
import About from 'app/wizard/About';
import WizardTooltip from 'app/wizard/WizardTooltip';

const ResponsiveContainer = styled('div')(
  ({ theme }) => `
  overflow: clip;
  height: 100vh;
  display: flex;
  flex-direction: column;
  ${theme.breakpoints.up('md')} {
    margin-left: ${theme.drawerWidth};
  }
`
);

const App = () => {
  const [navbarRef, footerRef, dims] = useMeasureChart<HTMLDivElement>();

  return (
    <>
      <DivisionDrawer />
      <ResponsiveContainer>
        <NavigationBar ref={navbarRef} />
        <Chart {...dims} />
        <Footer ref={footerRef} />
        <Actions />
      </ResponsiveContainer>
      <GrantsDialog />
      <WizardTooltip />
      <About />
    </>
  );
};

export default App;
