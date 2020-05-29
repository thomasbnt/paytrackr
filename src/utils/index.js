import browser from "webextension-polyfill";
import axios from "axios";

export const getRecords = async (key, defaultValue = []) => {
  try {
    const res = await browser.storage.local.get(key);
    return res[key] || defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

export const setRecords = async (key, data) => {
  try {
    const res = await browser.storage.local.set({ [key]: data });
    return res || [];
  } catch (e) {
    return [];
  }
};

export const getScaledAmount = (amount, scale) => {
  return Number((amount * Math.pow(10, -scale)).toFixed(scale));
};

export const extractHostname = (url) => {
  let hostname;
  //find & remove protocol (http, ftp, etc.) and get hostname

  if (url.indexOf("//") > -1) {
    hostname = url.split("/")[2];
  } else {
    hostname = url.split("/")[0];
  }

  //find & remove port number
  hostname = hostname.split(":")[0];
  //find & remove "?"
  hostname = hostname.split("?")[0];

  return hostname;
};

export const makeid = (length) => {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const getRandomColor = () => {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export const getXRPinUSD = async () => {
  const { data } = await axios.get(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=ripple&order=market_cap_desc&per_page=100&page=1&sparkline=false",
  );
  return data[0].current_price;
};

export const validateEmail = (email) => {
  var re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

export const notify = async (title, message) => {
  try {
    await browser.notifications.create({
      type: "basic",
      title,
      message,
      iconUrl: browser.extension.getURL("icons/icon_48.png"),
    });
  } catch (e) {
    console.log("Error from background.js", e);
  }
};
