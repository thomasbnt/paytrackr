<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title>PayTrackr</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="changeTheme">
        <v-icon>mdi-theme-light-dark</v-icon>
      </v-btn>
      <v-menu>
        <template v-slot:activator="{ on }"
          ><v-btn v-on="on" icon>
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="resetDataDialog = true">
            <v-list-item-title>Reset Data</v-list-item-title>
          </v-list-item>
          <v-list-item @click="aboutDialog = true">
            <v-list-item-title>About PayTrackr</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <template v-slot:extension>
        <v-tabs v-model="tab" centered>
          <v-tab v-for="item in items" :key="item">
            {{ item }}
          </v-tab>
        </v-tabs>
      </template>
    </v-app-bar>
    <v-content>
      <v-container>
        <v-tabs-items v-model="tab">
          <v-tab-item eager>
            <Dashboard :xrpInUSD="xrpInUSD" />
          </v-tab-item>
          <v-tab-item eager>
            <RecentPayments />
          </v-tab-item>
          <v-tab-item eager>
            <Alerts />
          </v-tab-item>
        </v-tabs-items>
      </v-container>
    </v-content>
    <!-- Dialog -->
    <v-dialog v-model="resetDataDialog">
      <v-card>
        <v-card-title>
          Are you sure?
        </v-card-title>
        <v-card-text>
          This will reset all payments back to 0 and clear all alerts.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="resetDataDialog = false">Cancel</v-btn>
          <v-btn text @click="resetData">Clear</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Dialog -->
    <v-dialog v-model="aboutDialog">
      <v-card>
        <v-card-title> PayTrackr {{ manifestVal.version }} </v-card-title>
        <v-card-text>
          <p v-text="manifestVal.description"></p>
          <v-list>
            <v-list-item href="https://robsoriano.com" target="_BLANK">
              <v-list-item-content>
                <v-list-item-title>Visit Developer</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item href="mailto:paytrackr@gmail.com" target="_BLANK">
              <v-list-item-content>
                <v-list-item-title>Report an issue</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item
              href="https://chrome.google.com/webstore/detail/paytrackr/jmkofipfojjlklmjpedfiokppaojkoel"
              target="_BLANK"
            >
              <v-list-item-content>
                <v-list-item-title>Rate</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
    <!-- Snackbar -->
    <v-snackbar v-model="snackbar">
      {{ snackbarText }}
    </v-snackbar>
  </v-app>
</template>

<script>
import { getRecords, setRecords } from '../utils';
import Dashboard from '../components/Dashboard';
import RecentPayments from '../components/RecentPayments';
import Alerts from '../components/Alerts';
import manifest from '../manifest.json';

export default {
  components: {
    Dashboard,
    RecentPayments,
    Alerts
  },
  data() {
    return {
      tab: null,
      items: ['dashboard', 'recent payments', 'alerts'],
      loading: false,
      xrpInUSD: 0,
      resetDataDialog: false,
      snackbar: false,
      snackbarText: '',
      aboutDialog: false
    };
  },
  async created() {
    this.$vuetify.theme.dark = true;
    const [theme, price] = await Promise.all([
      getRecords('paytrackr_theme', 'dark'),
      getRecords('paytrackr_xrp_in_usd')
    ]);
    if (theme !== 'dark') {
      this.$vuetify.theme.dark = false;
    }
    this.xrpInUSD = price;

    this.$browser.storage.onChanged.addListener(changes => {
      if (changes['paytrackr_xrp_in_usd']) {
        this.xrpInUSD = changes['paytrackr_xrp_in_usd'].newValue;
      }
    });
  },
  methods: {
    async changeTheme() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
      await setRecords(
        'paytrackr_theme',
        this.$vuetify.theme.dark ? 'dark' : 'light'
      );
    },
    async resetData() {
      this.resetDataDialog = false;
      await Promise.all([
        setRecords('paytrackr_hostnames', []),
        setRecords('paytrackr_history', []),
        setRecords('paytrackr_alerts', [])
      ]);
      this.snackbarText = 'Cleared';
      this.snackbar = true;
      this.resetDataDialog = false;
    }
  },
  watch: {
    resetDataDialog(val) {
      if (!val) {
        this.email = null;
        this.amount = 0;
      }
    }
  },
  computed: {
    manifestVal() {
      return manifest;
    }
  }
};
</script>
