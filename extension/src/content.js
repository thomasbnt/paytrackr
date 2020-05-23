import {
  getRecords,
  setRecords,
  getRandomColor,
  makeid,
  extractHostname
} from './utils';
import config from './config';
import axios from 'axios';
import BigNumber from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 6 });

// Inject to all tabs so we can track
// monetization progress
const script = document.createElement('script');
// TODO: add "inject.js" to web_accessible_resources in manifest.json
script.src = chrome.runtime.getURL('inject.js');
script.onload = function() {
  this.remove();
};
(document.head || document.documentElement).appendChild(script);

// setRecords('paytrackr_history', []);
// setRecords('paytrackr_hostnames', []);

// Listen to monetization progress event
// sent by our injected file
document.addEventListener('paytrackr_monetizationprogress', async e => {
  const [history, hostnames, alerts, xrpPriceInUSD] = await Promise.all([
    getRecords('paytrackr_history'),
    getRecords('paytrackr_hostnames'),
    getRecords('paytrackr_alerts'),
    getRecords('paytrackr_xrp_in_usd')
  ]);

  const { amount, assetScale, assetCode } = e.detail;
  const scale = Math.pow(10, assetScale);
  const newScaledAmount = new BigNumber(amount, 10).div(scale).toNumber();

  const item = {
    ...e.detail,
    id: makeid(10),
    scaledAmount: newScaledAmount,
    url: e.target.URL,
    date: Date.now()
  };

  history.unshift(item);
  setRecords('paytrackr_history', history);

  const hostname = extractHostname(e.target.URL);
  const hostnameIndex = hostnames.findIndex(i => i.hostname === hostname);

  if (hostnameIndex !== -1) {
    const totalAmount = new BigNumber(hostnames[hostnameIndex].total, 10)
      .plus(newScaledAmount)
      .toNumber();
    hostnames[hostnameIndex].total = totalAmount;
    hostnames[hostnameIndex].lastUpdate = Date.now();
  } else {
    hostnames.push({
      hostname,
      assetScale,
      assetCode,
      total: newScaledAmount,
      lastUpdate: Date.now(),
      color: getRandomColor()
    });
  }

  setRecords('paytrackr_hostnames', hostnames);

  let currentTotal = 0;
  hostnames.forEach(host => {
    if (host.assetCode === 'XRP') {
      currentTotal = new BigNumber(currentTotal, 10)
        .plus((host.total * xrpPriceInUSD).toFixed(6))
        .toNumber();
    } else {
      currentTotal = new BigNumber(currentTotal, 10)
        .plus(host.total)
        .toNumber();
    }
  });

  // Send alerts
  const activeAlerts = alerts.filter(i => !i.done);
  activeAlerts.forEach(alert => {
    if (currentTotal >= alert.amount) {
      const alertIdx = alerts.findIndex(i => i.id === alert.id);
      alerts[alertIdx].done = true;
      console.log('Sending alert for amount ', alert.amount);
      axios.post(`${config.apiUrl}/sendmail`, {
        email: alert.email,
        amount: alert.amount
      });
    }
  });

  setRecords('paytrackr_alerts', alerts);
});
