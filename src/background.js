import { setRecords, getRecords, getXRPinUSD } from './utils';
import browser from 'webextension-polyfill';
import BigNumber from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 9 });

let XRPPriceInUSD;

async function setCurrencyConversion() {
  try {
    XRPPriceInUSD = await getXRPinUSD();
    console.log('Current XRP price in USD', XRPPriceInUSD);
    await setRecords('paytrackr_xrp_in_usd', XRPPriceInUSD);
  } catch (e) {
    console.log('Error from background.js', e);
  }
}

async function notify(title, message) {
  try {
    await browser.notifications.create({
      type: 'basic',
      title,
      message,
      iconUrl: browser.extension.getURL('icons/icon_48.png')
    });
  } catch (e) {
    console.log('Error from background.js', e);
  }
}

setCurrencyConversion();

// Get conversion every minute
setInterval(() => {
  setCurrencyConversion();
}, 60000);

browser.storage.onChanged.addListener(async changes => {
  if (changes['paytrackr_hostnames']) {
    const hostnames = changes['paytrackr_hostnames'].newValue;

    const alerts = await getRecords('paytrackr_alerts');

    let currentTotal = 0;
    hostnames.forEach(host => {
      if (host.assetCode === 'XRP') {
        currentTotal = new BigNumber(currentTotal, 10)
          .plus((host.total * XRPPriceInUSD).toFixed(6))
          .toNumber();
      } else {
        currentTotal = new BigNumber(currentTotal, 10)
          .plus(host.total)
          .toNumber();
      }
    });

    const activeAlerts = alerts.filter(i => !i.done);
    activeAlerts.forEach(alert => {
      if (currentTotal >= alert.amount) {
        const alertIdx = alerts.findIndex(i => i.date === alert.date);
        alerts[alertIdx].done = true;
        notify('PayTrackr', `You've paid a total of $${alert.amount}!`);
      }
    });

    setRecords('paytrackr_alerts', alerts);
  }
});

browser.runtime.onMessage.addListener((msg) => {
  if (msg === 'paytrackr_monetizationstart') {
    browser.browserAction.setBadgeText({text: '$'});
  } else if (msg === 'paytrackr_monetizationstop') {
    browser.browserAction.setBadgeText({text: ''});
  }
});