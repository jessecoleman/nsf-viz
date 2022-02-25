import { Button, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, styled, Typography } from '@material-ui/core';
import LaunchIcon from '@mui/icons-material/Launch';
import { useLoadAbstract } from 'api';
import { useGrantIdQuery, useQuery } from 'app/query';
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
  const [ grantId, setGrantId ] = useGrantIdQuery();
  const { data: grant, isLoading } = useLoadAbstract(grantId, { terms }, {
    query: {
      enabled: grantId !== undefined,
      select: (d) => d.data
    }
  });
  
  const dismissDialog = () => {
    setGrantId(undefined);
  };

  const timeConvert = (date: string) => (
    d3.timeFormat('%b %e, %Y')(
      d3.timeParse('%Y-%m-%d')(date)!
    )
  );

  return (
    <Dialog
      open={!!grantId}
      onClose={dismissDialog}
    >
      {grant && (
        <>
          <DialogTitle>
            <Title variant='h5'>
              {grant.title}
              {grant.external_url && (
                <a href={grant.external_url} target="_blank" rel="noreferrer"><LaunchIcon /></a>
              )}
            </Title>
            <Subtitle variant='h6'>{grant.cat1_raw}</Subtitle>
            <Subtitle variant='h6'>{timeConvert(grant.date)}</Subtitle>
            <Subtitle variant='h6'>{d3.format('$,')(grant.amount)}</Subtitle>
          </DialogTitle>
          <DialogContent>
            <Collapse in={!!grant.abstract}>
              <Abstract dangerouslySetInnerHTML={{
                __html: grant.abstract ?? ''
              }} />
            </Collapse>
          </DialogContent>
          <DialogActions>
            <Button onClick={dismissDialog}>
              Dismiss
            </Button>
          </DialogActions>
        </>
      )}
      {isLoading && <LinearProgress />}
    </Dialog>
  );
};

export default AbstractDialog;
