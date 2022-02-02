import { Tooltip, Button } from '@material-ui/core';
import { clearGrants } from 'app/dataReducer';
import { useGrantsDialogQuery } from 'app/query';
import { useDispatch } from 'react-redux';

const GrantButton = () => {

  const dispatch = useDispatch();
  const [ , setDialogQuery ] = useGrantsDialogQuery();

  const handleOpen = () => {
    dispatch(clearGrants());
    setDialogQuery({ grantDialogOpen: true });
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
