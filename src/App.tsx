import React from 'react';

import logo from './logo.svg';
import NavigationBar from 'app/components/NavigationBar'
import Main from 'app/components/Main'

const App: React.FC<{
  path: string,
  terms?: string,
}> = (props) => {
  console.log(props.terms);
  return (
    <div style={{height: '100vh'}}>
      <NavigationBar />
      <Main />
    </div>
  );
}

//<Redirect noThrow from='/' to='data%20science,machine%20learning' />

export default App;
