import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor'; // Ensure Meteor is imported

// This handler will intercept POST requests to '/api/callMethod'
WebApp.connectHandlers.use('/api/callMethod', (req, res, next) => {
  // Only process POST requests
  if (req.method === 'POST') {
    let body = '';
    
    // Collect data chunks from the request body
    req.on('data', chunk => {
      body += chunk.toString();
    });

    // When the entire body has been received
    req.on('end', () => {
      let payload;
      try {
        // Parse the JSON body from the Postman request
        payload = JSON.parse(body);
      } catch (e) {
        console.error('SERVER API: Failed to parse request body:', e);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON request body.' }));
        return; // Stop execution if JSON is invalid
      }

      const { method, params } = payload; // Extract method name and parameters

      if (!method || !Array.isArray(params)) {
        console.error('SERVER API: Invalid method call payload. Missing "method" or "params" array.');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'Invalid payload: "method" and "params" array are required.' }));
        return;
      }

      console.log(`SERVER API: Attempting to call Meteor method: ${method} with params:`, params);

      // Call the Meteor method asynchronously
      // Meteor.callAsync is used to ensure it's non-blocking and handles async operations
      Meteor.callAsync(method, ...params)
        .then(result => {
          console.log(`SERVER API: Method ${method} succeeded. Result:`, result);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'success', result: result }));
        })
        .catch(error => {
          console.error(`SERVER API: Method ${method} failed. Error:`, error);
          // If it's a Meteor.Error, extract reason; otherwise, use generic message
          const errorMessage = error.reason || error.message || 'An unknown error occurred.';
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'error', message: errorMessage, code: error.error }));
        });
    });
  } else {
    // For any method other than POST to this endpoint
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'error', message: 'Method Not Allowed. Only POST is supported for this API endpoint.' }));
  }
});

// IMPORTANT: This file needs to be imported in your server/main.js
// so that Meteor knows about this new HTTP handler.
