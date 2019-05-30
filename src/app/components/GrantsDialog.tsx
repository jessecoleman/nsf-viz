import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createStyles, Theme, makeStyles } from '@material-ui/core/styles';

import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';

import Cells from 'app/components/Cells';

import { getGrants } from 'app/actions';

const useStyles = makeStyles((theme: Theme) => createStyles({
    root: {
      padding: theme.spacing(2),
      flexGrow: 1,
    },
    fab: {
      marginRight: theme.spacing(1)
      //position: 'fixed',
      //bottom: theme.spacing(4),
      //left: theme.spacing(4),
    }
}));

const GrantsDialog: React.FC = () => {
  const classes = useStyles();

  const [ open, setOpen ] = useState(false);
  const grants = useSelector(state => state.data.grants);
  const dispatch = useDispatch();

  const handleOpen = () => {
    dispatch(getGrants());
    setOpen(true);
  }

  const handleClose = () => {
    setOpen(false);
  }

  console.log(grants);

  return (
    <>
      <Button 
        variant='text' 
        aria-label='grants' 
        className={classes.fab}
        onClick={handleOpen}
      >
        GRANTS
      </Button>
      <Dialog
        fullWidth={true}
        maxWidth='xl'
        open={open}
        onClose={handleClose}
      >
        <DialogTitle>Grants</DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Grant Title</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Division</TableCell>
             </TableRow>
            </TableHead>
            <TableBody>
              {grants.map(g => (
                <TableRow>
                  <TableCell>{g.title}</TableCell>
                  <TableCell>{g.date}</TableCell>
                  <TableCell>{g.amount}</TableCell>
                  <TableCell>{g.division}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default GrantsDialog;
