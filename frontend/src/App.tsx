import NavigationBar from 'app/components/NavigationBar';
import Main from 'app/components/Main';
import { Box } from '@material-ui/core';
import { Route } from 'react-router';
import { useNavigate } from 'app/hooks';


const App = () => {
  
  return (
    <Box height='100vh' overflow='hidden'>
      <NavigationBar />
      <Main />
    </Box>
  );
};

export default App;
