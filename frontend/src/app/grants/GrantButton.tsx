import { Tooltip, Button } from '@material-ui/core';
import { clearGrants } from 'app/dataReducer';
import { setGrantDialogOpen } from 'app/filterReducer';
import { useDispatch } from 'react-redux';

const GrantButton = () => {

  const dispatch = useDispatch();

  const handleOpen = () => {
    dispatch(clearGrants());
    dispatch(setGrantDialogOpen(true));
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
