import { Tooltip, Button } from '@material-ui/core';
import { clearGrants } from 'app/dataReducer';
import { useQuery } from 'app/hooks';
import { useDispatch } from 'react-redux';

const GrantButton = () => {

  const dispatch = useDispatch();
  const [ , setQuery ] = useQuery();

  const handleOpen = () => {
    dispatch(clearGrants());
    dispatch(setQuery({ grantDialog: true }));
  };

  return (
    <Tooltip title='view grant details'>
      <Button 
        variant='text' 
        aria-label='grants' 
        onClick={handleOpen}
      >
        GRANTS
      </Button>
    </Tooltip>
  );
};

export default GrantButton;
