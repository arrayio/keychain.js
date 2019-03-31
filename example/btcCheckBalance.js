const fetch = require('node-fetch');
const API_URL = 'https://test-insight.bitpay.com/api';
const address = 'YOUR_ADDRESS'; // myLrbwvwJN59quivKSxCxgiqLdCw8m7aDf
fetch(`${API_URL}/addr/${address}`)
  .then( data => data.json() )
  .then(({ balance }) => console.log('BTC Balance: ', balance));
