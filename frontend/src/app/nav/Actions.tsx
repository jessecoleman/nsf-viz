import { Link, SpeedDial, SpeedDialAction, SpeedDialIcon } from '@material-ui/core';
import { GitHub, GridOn, InsertDriveFile } from '@material-ui/icons';

const actions = [
  {
    name: 'Download Tabular Data',
    icon: <GridOn />,
    href: ''
  },
  {
    name: 'Download Grant Data',
    icon: <InsertDriveFile />,
    href: ''
  },
  {
    name: 'View Source',
    icon: <GitHub />,
    href: 'https://github.com/jessecoleman/nsf-viz'
  }
];


const Actions = () => {
  
  return (
    <SpeedDial
      ariaLabel="SpeedDial basic example"
      sx={{ position: 'absolute', bottom: 16, right: 16 }}
      icon={<SpeedDialIcon />}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={<Link href={action.href}>{action.icon}</Link>}
          tooltipTitle={action.name}
        />
      ))}
    </SpeedDial>
  );
};

export default Actions;