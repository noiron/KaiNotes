import React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';

// TODO: 标签的排序

ReactDOM.createRoot(document.getElementById('root')).render(
  <App tags={window.tags} />
);
