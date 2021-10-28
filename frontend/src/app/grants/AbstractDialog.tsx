import { Button, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, styled, Typography } from '@material-ui/core';
import { dismissAbstractDialog } from 'app/dataReducer';
import { getDivisionsMap, getSelectedAbstract, getSelectedGrant } from 'app/selectors';
import { useAppDispatch, useAppSelector } from 'app/store';
import * as d3 from 'd3';

const Title = styled(Typography)(({ theme }) => `
    color: ${theme.palette.text.primary};
`);

const Subtitle = styled(Typography)(({ theme }) => `
    color: ${theme.palette.text.secondary};
`);

const Abstract = styled(Typography)(({ theme }) => `
  line-height: 1.75;
  & em {
    display: inline-block;
    font-style: normal;
    background: ${theme.palette.grey[300]};
    padding: ${theme.spacing(0.25, 1)};
    border-radius: ${theme.spacing(2)};
  }
`);

const AbstractDialog = () => {
  
  const selectedGrant = useAppSelector(getSelectedGrant);
  const selectedAbstract = useAppSelector(getSelectedAbstract);

  const dispatch = useAppDispatch();

  const dismissDialog = () => {
    dispatch(dismissAbstractDialog());
  };

  const timeConvert = (date: string) => (
    d3.timeFormat('%b %e, %Y')(
      d3.timeParse('%Y-%m-%d')(date)!
    )
  );

  const loading = selectedAbstract === undefined;
  
  if (!selectedGrant) return null;
 
  return (
    <Dialog
      open={selectedGrant !== undefined}
      onClose={dismissDialog}
    >
      <DialogTitle>
        <Title variant='h5'>{selectedGrant.title}</Title>
        <Subtitle variant='h6'>{selectedGrant.cat1_raw}</Subtitle>
        <Subtitle variant='h6'>{timeConvert(selectedGrant.date)}</Subtitle>
        <Subtitle variant='h6'>{d3.format('$,')(selectedGrant.amount)}</Subtitle>
      </DialogTitle>
      <DialogContent>
        {loading && <LinearProgress />}
        <Collapse in={!loading}>
          <Abstract dangerouslySetInnerHTML={{
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
