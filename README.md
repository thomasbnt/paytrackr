# PayTrackr

> PayTrackr is the easiest and safest way to track and manage your micropayments to web monetized websites, having a web monetization provider membership (i.e. Coil).

## Download links

- [Chrome](https://chrome.google.com/webstore/detail/paytrackr/pcfbnmieeijeahdbbjefgkcbkfnccpei)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/paytrackr/)
- Edge - In Review

## Features

- **Dashboard** - Aggregated breakdown on how much went to each site in total
- **Recent Payments** - History of micropayments to websites with web monetization
- **Payment Alerts** - Get notifications when a certain amount is reached
- **Export History** - Export micropayments history to csv/xlsx
- **Theme Switcher** - Choose between light and dark mode

## Usage

```bash
$ npm install
$ npm run build:dev
```

## Running locally

Google Chrome

1. Open Chrome and type `chrome://extensions` in the search bar. Turn the switch `Developer mode` on.

![step1](https://i.imgur.com/oErOjET.png)

2. Look for the button `Load unpacked` at the top-left and select the `dist` folder found in the root's path of our extension when we run `npm run build:dev`.

![step2](https://i.imgur.com/mPlfKxK.png)

3. Run `npm run watch:dev` to enable hot reloading of the extension.

## Commands

### `npm run build`

Build the extension into `dist` folder for **production**.

### `npm run build:dev`

Build the extension into `dist` folder for **development**.

### `npm run watch`

Watch for modifications then run `npm run build`.

### `npm run watch:dev`

Watch for modifications then run `npm run build:dev`.

It also enable [Hot Module Reloading](https://webpack.js.org/concepts/hot-module-replacement), thanks to [webpack-extension-reloader](https://github.com/rubenspgcavalcante/webpack-extension-reloader) plugin.

:warning: Keep in mind that HMR only works for your **background** entry.

### `npm run build-zip`

Build a zip file following this format `<name>-v<version>.zip`, by reading `name` and `version` from `manifest.json` file.
Zip file is located in `dist-zip` folder.

## License

This plugin is released under the [MIT License](LICENSE.md).
