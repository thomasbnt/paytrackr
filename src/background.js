import { setRecords, getXRPinUSD } from "./utils";
import browser from "webextension-polyfill";

let XRPPriceInUSD;

async function setCurrencyConversion() {
  try {
    XRPPriceInUSD = await getXRPinUSD();
    console.log("Current XRP price in USD", XRPPriceInUSD);
    await setRecords("paytrackr_xrp_in_usd", XRPPriceInUSD);
  } catch (e) {
    console.log("Error from background.js", e);
  }
}

setCurrencyConversion();

// Get conversion every minute
setInterval(() => {
  setCurrencyConversion();
}, 60000);

browser.runtime.onMessage.addListener((msg) => {
  if (msg === "paytrackr_monetizationstart") {
    browser.browserAction.setBadgeText({ text: "$" });
  } else if (msg === "paytrackr_monetizationstop") {
    browser.browserAction.setBadgeText({ text: "" });
  }
});
