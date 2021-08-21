import NavigationBar from 'app/components/NavigationBar';
import Main from 'app/components/Main';
import { Box } from '@material-ui/core';
import { Route } from 'react-router';
import { useNavigate } from 'app/hooks';


const App = () => {
  
  return (
    <Route>
      <Box height='100vh' overflow='hidden'>
        <NavigationBar />
        <Main />
      </Box>
    </Route>
  );
};

//<Redirect noThrow from='/' to='data%20science,machine%20learning' />

export default App;
