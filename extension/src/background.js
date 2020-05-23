import { setRecords, getXRPinUSD } from './utils';

async function setCurrencyConversion() {
  try {
    const price = await getXRPinUSD();
    console.log('Current XRP price in USD', price);
    await setRecords('paytrackr_xrp_in_usd', price);
  } catch (e) {
    console.log('Error from background.js', e);
  }
}

setCurrencyConversion();

// Get conversion every minute
setInterval(() => {
  setCurrencyConversion();
}, 60000);
