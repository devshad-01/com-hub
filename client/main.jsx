import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { Meteor } from 'meteor/meteor';
import { App } from '/imports/ui/App';
import '/imports/startup/client';

Meteor.startup(() => {
  const container = document.getElementById('react-target');
  const root = createRoot(container);
 
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
});