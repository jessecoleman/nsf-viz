import NavigationBar from 'app/components/NavigationBar';
import Main from 'app/components/Main';
import { Box } from '@material-ui/core';


const App = () => {
  
  return (
    <Box height='100vh' overflow='clip'>
      <NavigationBar />
      <Main />
    </Box>
  );
};

export default App;
