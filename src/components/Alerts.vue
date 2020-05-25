<template>
  <div>
    <v-list two-line subheader v-if="items.length">
      <v-subheader>Payment Alerts</v-subheader>
      <template v-for="(i, idx) in items">
        <v-divider inset :key="idx" v-if="idx !== 0"></v-divider>
        <v-list-item :key="i.date">
          <v-list-item-avatar>
            <v-icon>mdi-bell-alert</v-icon>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title v-text="`$${i.amount} USD`"></v-list-item-title>
            <!-- <v-list-item-subtitle v-text="i.email"></v-list-item-subtitle> -->
            <v-list-item-subtitle>Added on {{ i.date | filterDate }}</v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-menu bottom left>
              <template v-slot:activator="{ on }">
                <v-btn v-on="on" icon>
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
        Create an alert now to receive updates when
        <br />your total payments reached your budget!
      </p>
    </tab-placeholder>
    <v-dialog v-model="newAlertDialog">
      <v-card>
        <v-card-title>New Alert</v-card-title>
        <v-card-text>
          <v-text-field
            label="Amount"
            type="number"
            v-model.number="amount"
            prepend-icon="mdi-currency-usd"
            :error-messages="errors"
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
    <v-snackbar v-model="snackbar">{{ snackbarText }}</v-snackbar>
  </div>
</template>

<script>
import { setRecords, getRecords } from '../utils';
import BigNumber from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 9 });

export default {
  data: () => ({
    newAlertDialog: false,
    amount: 0,
    items: [],
    snackbar: false,
    snackbarText: null,
    errors: []
  }),
  async mounted() {
    this.items = await getRecords('paytrackr_alerts');
  },
  methods: {
    async validate() {
      this.errors = [];

      if (!this.amount) {
        this.errors.push('Amount is required');
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

      if (this.amount && currentTotal > this.amount) {
        this.errors.push('Amount must be greater than total payments');
      }

      if (this.errors.length) {
        return false;
      }

      return true;
    },
    async save() {
      const passed = await this.validate();
      if (!passed) {
        return;
      }

      this.items.unshift({
        date: Date.now(),
        amount: this.amount,
        done: false
      });
      await setRecords(
        'paytrackr_alerts',
        JSON.parse(JSON.stringify(this.items))
      );
      this.snackbarText = 'Alert saved';
      this.snackbar = true;
      this.newAlertDialog = false;
    },
    async deleteAlert(item) {
      const idx = this.items.findIndex(i => i.date === item.date);
      this.items.splice(idx, 1);
      await setRecords(
        'paytrackr_alerts',
        JSON.parse(JSON.stringify(this.items))
      );
      this.snackbarText = 'Alert deleted';
      this.snackbar = true;
    }
  },
  watch: {
    newAlertDialog(val) {
      if (!val) {
        this.errors = [];
        this.amount = 0;
      }
    }
  }
};
</script>
