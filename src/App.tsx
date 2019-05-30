import React from 'react';
import { HashRouter as Router, Route, Redirect } from 'react-router-dom';

import logo from './logo.svg';
import './App.css';

import NavigationBar from 'app/components/NavigationBar'
import Main from 'app/components/Main'

const App: React.FC = () => {
  return (
    <div style={{height: '100vh'}}>
      <NavigationBar />
      <Main />
    </div>
  );
}

export default App;
