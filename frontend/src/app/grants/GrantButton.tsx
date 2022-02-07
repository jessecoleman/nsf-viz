import { Tooltip, Button } from '@material-ui/core';
import { useGrantsDialogQuery } from 'app/query';

const GrantButton = () => {

  const [ , setDialogQuery ] = useGrantsDialogQuery();

  const handleOpen = () => {
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
