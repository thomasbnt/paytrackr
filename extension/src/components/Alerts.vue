<template>
  <div>
    <v-list three-line subheader v-if="items.length">
      <v-subheader>Payment Alerts</v-subheader>
      <template v-for="(i, idx) in items">
        <v-divider inset :key="idx" v-if="idx !== 0"></v-divider>
        <v-list-item :key="i.date">
          <v-list-item-avatar>
            <v-icon>mdi-bell-alert</v-icon>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title v-text="`$${i.amount} USD`"></v-list-item-title>
            <v-list-item-subtitle v-text="i.email"></v-list-item-subtitle>
            <v-list-item-subtitle
              >Added on {{ i.date | filterDate }}</v-list-item-subtitle
            >
          </v-list-item-content>

          <v-list-item-action>
            <v-menu bottom left>
              <template v-slot:activator="{ on }"
                ><v-btn v-on="on" icon>
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item @click="deleteAlert(i)">
                  <v-list-item-title>Delete</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-list-item-action>
        </v-list-item>
      </template>
    </v-list>
    <tab-placeholder v-else>
      <h4>No alerts found.</h4>
      <p>
        Create an alert now to receive updates when <br />
        your total payments reached your budget!
      </p>
    </tab-placeholder>
    <v-dialog v-model="newAlertDialog">
      <v-card>
        <v-card-title>
          New Alert
        </v-card-title>
        <v-card-text>
          <v-text-field
            label="Amount"
            type="number"
            v-model.number="amount"
            prepend-icon="mdi-currency-usd"
            :error-messages="amountErrors"
          ></v-text-field>
          <v-text-field
            prepend-icon="mdi-email"
            label="Email"
            type="email"
            v-model="email"
            :error-messages="emailErrors"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="save">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-btn fixed fab bottom right @click="newAlertDialog = true">
      <v-icon>mdi-plus</v-icon>
    </v-btn>
    <v-snackbar v-model="snackbar">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script>
import { setRecords, getRecords, validateEmail } from '../utils';
import BigNumber from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 6 });

export default {
  data: () => ({
    newAlertDialog: false,
    amount: 0,
    email: null,
    items: [],
    snackbar: false,
    snackbarText: null,
    amountErrors: [],
    emailErrors: []
  }),
  async mounted() {
    this.items = await getRecords('paytrackr_alerts');
  },
  methods: {
    async validate() {
      this.amountErrors = [];
      this.emailErrors = [];

      if (!this.email) {
        this.emailErrors.push('Email is required');
      }

      if (!this.amount) {
        this.amountErrors.push('Amount is required');
      }

      const [hostnames, xrpPriceInUSD] = await Promise.all([
        getRecords('paytrackr_hostnames'),
        getRecords('paytrackr_xrp_in_usd')
      ]);

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
      console.log(currentTotal);
      if (this.email && !validateEmail(this.email)) {
        this.emailErrors.push('Email is invalid');
      }

      if (this.amount && currentTotal > this.amount) {
        this.amountErrors.push('Amount must be greater than total payments');
      }

      if (this.amountErrors.length || this.emailErrors.length) {
        return false;
      }

      return true;
    },
    async save() {
      const passed = await this.validate();
      console.log(passed);
      if (!passed) {
        return;
      }

      this.items.unshift({
        date: Date.now(),
        email: this.email,
        amount: this.amount,
        done: false
      });
      await setRecords('paytrackr_alerts', this.items);
      this.snackbarText = 'Alert saved';
      this.snackbar = true;
      this.newAlertDialog = false;
    },
    async deleteAlert(item) {
      const idx = this.items.findIndex(i => i.date === item.date);
      this.items.splice(idx, 1);
      await setRecords('paytrackr_alerts', this.items);
      this.snackbarText = 'Alert deleted';
      this.snackbar = true;
    }
  },
  watch: {
    newAlertDialog(val) {
      if (!val) {
        this.emailErrors = [];
        this.amountErrors = [];
        this.email = null;
        this.amount = 0;
      }
    }
  }
};
</script>
