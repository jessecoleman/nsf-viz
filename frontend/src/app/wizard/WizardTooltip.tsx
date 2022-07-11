import styled from '@material-ui/styled-engine';
import { alpha, Box } from '@material-ui/system';
import { Button, DialogActions, DialogContent, DialogTitle, Menu, Typography } from '@material-ui/core';
import { Close, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { useWizard } from './wizard';


const StyledActions = styled(DialogActions)(({ theme }) => `
  justify-content: space-between;
`);

const Overlay = styled(Box)(({ theme }) => `
  z-index: 1500;
  background-color: ${alpha(theme.palette.common.black, 0.5)};
  mix-blend-mode: multiply;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
`);

const StyledMenu = styled(Menu)(({ theme }) => `
  margin: ${theme.spacing(4)};
  z-index: 2000;
  & .MuiMenu-list {
    max-width: 18em;
    padding: ${theme.spacing(1)};
  }
  & .MuiDialogTitle-root {
    font-weight: bold;
  }
  & .MuiDialogTitle-root, .MuiDialogContent-root, .MuiDialogActions-root {
    padding: 0;
  }
`);

type Dims = Record<'left' | 'top' | 'width' | 'height' | 'padding', number>;
  
const Spotlight = styled('div')<Dims>(({ theme, left, top, width, height, padding }) => `
  background-color: white;
  position: fixed;
  border-radius: ${theme.spacing(2)};
  box-shadow: 0 0 ${theme.spacing(4, 4)} white;
  left: ${left - padding}px;
  top: ${top - padding}px;
  width: ${width + 2 * padding}px;
  height: ${height + 2 * padding}px;
`);

const WizardTooltip = () => {

  const { step, ref, navigateForward, navigateBack, cancelWizard } = useWizard();
  if (!step || !ref?.current) return null;

  const bbox = ref.current.getBoundingClientRect();

  return (
    <>
      <Overlay id='test'>
        <Spotlight
          left={bbox.left}
          top={bbox.top}
          width={bbox.width}
          height={bbox.height}
          padding={0}
        />
      </Overlay>
      <StyledMenu
        open={!!ref.current}
        anchorEl={ref.current}
        anchorOrigin={step.anchorOrigin}
        transformOrigin={step.transformOrigin}
      >
        <DialogTitle>
          {step.title}
        </DialogTitle>
        {step.description &&
          <DialogContent>
            <Typography>{step.description}</Typography>
          </DialogContent>
        }
        <StyledActions>
          <Button
            color='error'
            onClick={cancelWizard}
            startIcon={<Close />}
          >
            {navigateBack ? 'end' : 'skip tutorial'}
          </Button>
          {navigateBack && (
            <Button
              disabled={!navigateBack}
              onClick={navigateBack}
              startIcon={<NavigateBefore />}
            >
              prev
            </Button>
          )}
          <Button
            disabled={!navigateForward}
            onClick={navigateForward}
            endIcon={<NavigateNext />}
          >
            next
          </Button>
        </StyledActions>
      </StyledMenu>
    </>
  );
};

export default WizardTooltip;
