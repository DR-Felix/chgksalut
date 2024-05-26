import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
//
// Developer Console triggers rerender in React Strict Mode while in 'development'
//
// More info:                                                                     
// - https://stackoverflow.com/questions/61521734/why-does-my-create-react-app-console-log-twice
// - https://stackoverflow.com/questions/61328285/react-component-rendering-twice-when-using-usestate-hook
//
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

