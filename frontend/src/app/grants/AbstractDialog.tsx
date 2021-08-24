import { Button, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, makeStyles, styled, Typography } from '@material-ui/core';
import { dismissAbstractDialog } from 'app/dataReducer';
import { getSelectedAbstract, getSelectedGrant } from 'app/selectors';
import { useAppDispatch, useAppSelector } from 'app/store';

const Title = styled(Typography)(({ theme }) => `
    color: ${theme.palette.text.primary};
`);
const Subtitle = styled(Typography)(({ theme }) => `
    color: ${theme.palette.text.secondary};
`);

const AbstractDialog = () => {
  
  const selectedGrant = useAppSelector(getSelectedGrant);
  const selectedAbstract = useAppSelector(getSelectedAbstract);

  const dispatch = useAppDispatch();

  const dismissDialog = () => {
    dispatch(dismissAbstractDialog());
  };

  const loading = selectedAbstract === undefined;
 
  return (
    <Dialog
      open={selectedGrant !== undefined}
      onClose={dismissDialog}
    >
      <DialogTitle>
        <Title variant='h5'>{selectedGrant?.title}</Title>
        <Subtitle variant='h6'>{selectedGrant?.division}</Subtitle>
      </DialogTitle>
      <DialogContent>
        {loading && <LinearProgress />}
        <Collapse in={!loading}>
          <div dangerouslySetInnerHTML={{
            __html: selectedAbstract ?? ''
          }} />
        </Collapse>
      </DialogContent>
      <DialogActions>
        <Button onClick={dismissDialog}>
          Dismiss
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AbstractDialog;
