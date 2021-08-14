import NavigationBar from 'app/components/NavigationBar';
import Main from 'app/components/Main';
import { Box } from '@material-ui/core';

type AppProps = {
  path: string,
  terms?: string,
}

const App = (props: AppProps) => (
  <Box height='100vh' overflow='hidden'>
    <NavigationBar />
    <Main />
  </Box>
);

//<Redirect noThrow from='/' to='data%20science,machine%20learning' />

export default App;
