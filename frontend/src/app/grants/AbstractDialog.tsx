import { Button, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, styled, Typography } from '@material-ui/core';
import { Grant, useLoadAbstract } from 'api';
import { useGrantsDialogQuery, useQuery } from 'app/query';
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

  const [{ terms }] = useQuery();
  const [{ grantId }, setDialog ] = useGrantsDialogQuery();
  const grant: Grant = {} as Grant;
  const { data: abstract } = useLoadAbstract(grantId, terms, {
    query: {
      enabled: grantId !== undefined,
      select: (d) => d.data
    }
  });

  const dismissDialog = () => {
    setDialog({ grantId: undefined });
  };

  const timeConvert = (date: string) => (
    d3.timeFormat('%b %e, %Y')(
      d3.timeParse('%Y-%m-%d')(date)!
    )
  );

  const loading = abstract === undefined;
  
  if (!grant) return null;
 
  return (
    <Dialog
      open={false} //grant !== undefined}
      onClose={dismissDialog}
    >
      <DialogTitle>
        <Title variant='h5'>{grant.title}</Title>
        <Subtitle variant='h6'>{grant.cat1_raw}</Subtitle>
        <Subtitle variant='h6'>{timeConvert(grant.date)}</Subtitle>
        <Subtitle variant='h6'>{d3.format('$,')(grant.amount)}</Subtitle>
      </DialogTitle>
      <DialogContent>
        {loading && <LinearProgress />}
        <Collapse in={!!abstract}>
          <Abstract dangerouslySetInnerHTML={{
            __html: abstract ?? ''
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
