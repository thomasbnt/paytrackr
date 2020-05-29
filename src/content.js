import {
  getRecords,
  setRecords,
  getRandomColor,
  makeid,
  extractHostname,
  getTotalForEachAssetCode,
} from "./utils";
import BigNumber from "bignumber.js";
BigNumber.config({ DECIMAL_PLACES: 9 });
import browser from "webextension-polyfill";
import config from "./config";

// Inject to all tabs so we can track
// monetization progress
const script = document.createElement("script");
// TODO: add "inject.js" to web_accessible_resources in manifest.json
script.src = chrome.runtime.getURL("inject.js");
script.onload = function () {
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
  const sum = Object.values(pointers).reduce((sum, weight) => sum + weight, 0);
  let choice = Math.random() * sum;

  for (const pointer in pointers) {
    const weight = pointers[pointer];
    if ((choice -= weight) <= 0) {
      return pointer;
    }
  }
};

const updatePointer = async () => {
  const meta = document.head.querySelector("meta[name=monetization]");
  const isSupported = await getRecords("paytrackr_support_developer", false);

  if (!isSupported) return;

  meta.content = pickPointer({
    [config.myPointer]: 5,
    [originalPointer]: 95,
  });
};

// Listen to monetization progress event
// sent by our injected file
document.addEventListener("paytrackr_monetizationprogress", async (e) => {
  const [history, hostnames, alerts, XRPPriceInUSD] = await Promise.all([
    getRecords("paytrackr_history"),
    getRecords("paytrackr_hostnames"),
    getRecords("paytrackr_alerts"),
    getRecords("paytrackr_xrp_in_usd"),
  ]);

  const { amount, assetScale, assetCode, paymentPointer } = e.detail;
  const scale = Math.pow(10, assetScale);
  const newScaledAmount = (new BigNumber(amount, 10).div(scale).toNumber())
    .toFixed(assetScale);

  const item = {
    ...e.detail,
    id: makeid(10),
    scaledAmount: newScaledAmount,
    url: e.target.URL,
    date: Date.now(),
  };

  if (config.myPointer === paymentPointer) {
    item.toDeveloper = true;
  }

  history.unshift(item);
  setRecords("paytrackr_history", history);

  const hostname = extractHostname(e.target.URL);
  const hostnameIndex = hostnames.findIndex((i) => i.hostname === hostname);

  if (hostnameIndex !== -1) {
    const assetCodeIndex = hostnames[hostnameIndex].currencies.findIndex((i) =>
      i.assetCode === assetCode
    );
    if (assetCodeIndex !== -1) {
      const currentTotal =
        hostnames[hostnameIndex].currencies[assetCodeIndex].total;
      const totalAmount = new BigNumber(currentTotal, 10)
        .plus(newScaledAmount)
        .toNumber();
      hostnames[hostnameIndex].currencies[assetCodeIndex].total = totalAmount;
    } else {
      hostnames[hostnameIndex].currencies.push({
        assetCode,
        assetScale,
        total: newScaledAmount,
      });
    }
    hostnames[hostnameIndex].lastUpdate = Date.now();
  } else {
    hostnames.push({
      hostname,
      lastUpdate: Date.now(),
      color: getRandomColor(),
      currencies: [{
        assetCode,
        assetScale,
        total: newScaledAmount,
      }],
    });
  }

  setRecords("paytrackr_hostnames", hostnames);
  
  const currentTotal = getTotalForEachAssetCode(hostnames, false, XRPPriceInUSD).reduce((a, b) => a + b.total, 0);

  const activeAlerts = alerts.filter((i) => !i.done);

  activeAlerts.forEach((alert) => {
    if (currentTotal >= alert.amount) {
      const alertIdx = alerts.findIndex((i) => i.date === alert.date);
      alerts[alertIdx].done = true;
      browser.runtime.sendMessage(`You've paid a total of $${alert.amount}!`);
    }
  });
  setRecords("paytrackr_alerts", alerts);
});

let updatePointerInterval;

document.addEventListener("paytrackr_monetizationstart", (e) => {
  updatePointerInterval = setInterval(() => {
    updatePointer();
  }, 1000);
  browser.runtime.sendMessage("paytrackr_monetizationstart");
});

document.addEventListener("paytrackr_monetizationstop", (e) => {
  browser.runtime.sendMessage("paytrackr_monetizationstop");
  clearInterval(updatePointerInterval);
});
