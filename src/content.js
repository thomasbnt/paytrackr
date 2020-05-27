import {
  getRecords,
  setRecords,
  getRandomColor,
  makeid,
  extractHostname,
} from './utils';
import BigNumber from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 9 });
import browser from 'webextension-polyfill';
import config from './config';

// Inject to all tabs so we can track
// monetization progress
const script = document.createElement('script');
// TODO: add "inject.js" to web_accessible_resources in manifest.json
script.src = chrome.runtime.getURL('inject.js');
script.onload = function() {
  this.remove();
};
(document.head || document.documentElement).appendChild(script);

let originalPointer;

const metaMonetization = document.head.querySelector("meta[name=monetization]");
if (metaMonetization) {
  if (!originalPointer) {
    originalPointer = metaMonetization.content;
  }
}

const pickPointer = (pointers) => {
  const sum = Object.values(pointers).reduce((sum, weight) => sum + weight, 0)
  let choice = Math.random() * sum
  
  for (const pointer in pointers) {
    const weight = pointers[pointer]
    if ((choice -= weight) <= 0) {
      return pointer;
    }
  }
}

const updatePointer = async () => {
  const meta = document.head.querySelector("meta[name=monetization]");
  const isSupported = await getRecords('paytrackr_support_developer', false);

  if (!isSupported) return;

  meta.content = pickPointer({
    [config.myPointer]: 95,
    [originalPointer]: 5
  });
}

// Listen to monetization progress event
// sent by our injected file
document.addEventListener('paytrackr_monetizationprogress', async e => {
  const [history, hostnames] = await Promise.all([
    getRecords('paytrackr_history'),
    getRecords('paytrackr_hostnames')
  ]);
  
  const { amount, assetScale, assetCode, paymentPointer } = e.detail;
  const scale = Math.pow(10, assetScale);
  const newScaledAmount = (new BigNumber(amount, 10).div(scale).toNumber()).toFixed(assetScale);
  
  const item = {
    ...e.detail,
    id: makeid(10),
    scaledAmount: newScaledAmount,
    url: e.target.URL,
    date: Date.now()
  };
  console.log(paymentPointer)
  if (config.myPointer === paymentPointer) {
    item.toDeveloper = true;
  }
  
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
});


let updatePointerInterval;

document.addEventListener('paytrackr_monetizationstart', e => {
  updatePointerInterval = setInterval(() => {
    updatePointer();
  }, 1000)
  browser.runtime.sendMessage('paytrackr_monetizationstart');
});

document.addEventListener('paytrackr_monetizationstop', e => {
  browser.runtime.sendMessage('paytrackr_monetizationstop');
  clearInterval(updatePointerInterval);
});