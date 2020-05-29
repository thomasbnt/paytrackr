<template>
  <div>
    <div v-if="items.length">
      <v-card flat :loading="loading">
        <v-card-title>
          <span v-text="`${total} ${showInXRP ? 'XRP' : 'USD'}`"></span>
          <v-spacer></v-spacer>
          <v-btn
            v-if="false"
            text
            @click="showInXRP = !showInXRP"
          >Show in {{ showInXRP ? 'USD' : 'XRP' }}</v-btn>
        </v-card-title>
        <v-card-subtitle>Total Payments</v-card-subtitle>
        <v-card-text>
          <Doughnut v-if="!loading" :options="options" :chart-data="chartData" :height="200" />
        </v-card-text>
      </v-card>
    </div>
    <tab-placeholder v-else>
      <h4>No payments found.</h4>
      <p>Start supporting content creators by visiting their site!</p>
    </tab-placeholder>
    <v-list three-line subheader v-show="items.length">
      <v-subheader>Websites Visited</v-subheader>
      <template v-for="(i, idx) in itemsWithCalculatedCurrencies">
        <v-divider inset :key="idx" v-if="idx !== 0"></v-divider>
        <v-list-item :key="i.hostname">
          <v-list-item-avatar>
            <v-icon :style="{ color: i.color }">
              {{
              `mdi-alpha-${i.hostname.charAt(0)}-circle`
              }}
            </v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title v-text="i.hostname"></v-list-item-title>
            <v-list-item-subtitle v-text="`${i.total} ${showInXRP ? 'XRP' : 'USD' }`"></v-list-item-subtitle>
            <v-list-item-subtitle>
              Last payment:
              {{ i.lastUpdate | filterDate }}
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action>
            <v-btn
              icon
              @click="
                selectedWebsite = i;
                websiteInfoDialog = true;
              "
            >
              <v-icon>mdi-information</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </template>
    </v-list>
    <!-- Dialog -->
    <v-dialog v-model="websiteInfoDialog">
      <v-card>
        <v-card-title>
          Payment Summary
          <v-spacer></v-spacer>
          <v-btn icon @click="websiteInfoDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <div class="d-flex justify-center" v-if="websiteInfoLoading">
            <v-progress-circular :size="50" color="primary" indeterminate></v-progress-circular>
          </div>
          <v-list three-line>
            <template v-for="(value, name, idx) in websiteUrls">
              <v-divider inset :key="idx" v-if="idx !== 0"></v-divider>
              <v-list-item :key="name">
                <v-list-item-avatar>
                  <v-icon>mdi-contactless-payment</v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>
                    {{ value.total }} {{ showInXRP ? 'XRP' : 'USD' }}
                    <br v-if="value.wentToDeveloper" />
                    <span
                      class="caption"
                      v-if="value.wentToDeveloper"
                    >{{ value.wentToDeveloper }} {{ showInXRP ? 'XRP' : 'USD' }} of this went to developer ❤️</span>
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    <a :href="name" target="_BLANK" v-text="name"></a>
                  </v-list-item-subtitle>
                  <v-list-item-subtitle>
                    Last payment:
                    {{ value.lastUpdate | filterDate }}
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </template>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import Doughnut from '../components/Doughnut';
import { getRecords, getTotalForEachAssetCode } from '../utils';
import BigNumber from 'bignumber.js';
BigNumber.config({ DECIMAL_PLACES: 9 });

export default {
  props: ['xrpInUSD', 'showInXRP'],
  components: {
    Doughnut
  },
  data: () => ({
    items: [],
    loading: true,
    options: {
      legend: {
        display: false
      },
      tooltips: {
        callbacks: {
          title: function(tooltipItem, data) {
            return data['labels'][tooltipItem[0]['index']];
          },
          label: function(tooltipItem, data) {
            return data['datasets'][0]['data'][tooltipItem['index']];
          }
        }
      },
      animation: {
        duration: 0
      },
      hover: {
        animationDuration: 0
      },
      responsiveAnimationDuration: 0,
      responsive: true,
      maintainAspectRatio: false
    },
    selectedWebsite: {},
    selectedWebsiteUrls: [],
    websiteInfoDialog: false,
    websiteInfoLoading: false
  }),
  async mounted() {
    this.loading = true;
    await this.fetchHostnames();
    this.loading = false;
    // this.$browser.storage.onChanged.addListener(this.onChangeListener);
  },
  beforeDestroy() {
    // this.$browser.storage.onChanged.removeListener(this.onChangeListener);
  },
  methods: {
    onChangeListener(changes) {
      if (changes['paytrackr_hostnames']) {
        this.items = changes['paytrackr_hostnames'].newValue;
      }
    },
    async fetchHostnames() {
      try {
        this.items = await getRecords('paytrackr_hostnames');
      } catch (e) {
        console.log('Fetch hostnames error', e);
      }
    }
  },
  computed: {
    itemsWithCalculatedCurrencies() {
      return getTotalForEachAssetCode(
        this.items,
        this.showInXRP,
        this.xrpInUSD
      ).sort((a, b) => b.lastUpdate - a.lastUpdate);
    },
    chartData() {
      return {
        labels: this.itemsWithCalculatedCurrencies.map(i => i.hostname),
        datasets: [
          {
            data: this.itemsWithCalculatedCurrencies.map(i => i.total),
            backgroundColor: this.itemsWithCalculatedCurrencies.map(
              i => i.color
            )
          }
        ]
      };
    },
    total() {
      return this.itemsWithCalculatedCurrencies
        .reduce((a, b) => a + b.total, 0)
        .toFixed(9);
    },
    websiteUrls() {
      let urlMap = {};
      for (var i = 0; i < this.selectedWebsiteUrls.length; i++) {
        const item = this.selectedWebsiteUrls[i];
        if (urlMap[item.url]) {
          if (this.showInXRP && item.assetCode === 'USD') {
            const total = (item.scaledAmount * (1 / this.xrpInUSD)).toFixed(
              item.assetScale
            );

            urlMap[item.url].total = new BigNumber(urlMap[item.url].total, 10)
              .plus(total)
              .toNumber();

            if (item.toDeveloper) {
              urlMap[item.url].wentToDeveloper = new BigNumber(
                urlMap[item.url].wentToDeveloper,
                10
              )
                .plus(total)
                .toNumber();
            }
          } else if (!this.showInXRP && item.assetCode === 'XRP') {
            const total = (item.scaledAmount * this.xrpInUSD).toFixed(
              item.assetScale
            );

            urlMap[item.url].total = new BigNumber(urlMap[item.url].total, 10)
              .plus(total)
              .toNumber();

            if (item.toDeveloper) {
              urlMap[item.url].wentToDeveloper = new BigNumber(
                urlMap[item.url].wentToDeveloper,
                10
              )
                .plus(total)
                .toNumber();
            }
          } else {
            urlMap[item.url].total = new BigNumber(urlMap[item.url].total, 10)
              .plus(item.scaledAmount)
              .toNumber();

            if (item.toDeveloper) {
              urlMap[item.url].wentToDeveloper = new BigNumber(
                urlMap[item.url].wentToDeveloper,
                10
              )
                .plus(item.scaledAmount)
                .toNumber();
            }
          }
        } else {
          if (this.showInXRP && item.assetCode === 'USD') {
            const total = (item.scaledAmount * (1 / this.xrpInUSD)).toFixed(
              item.assetScale
            );
            urlMap[item.url] = {
              total: total,
              wentToDeveloper: item.toDeveloper ? total : 0,
              assetCode: item.assetCode,
              lastUpdate: item.date
            };
          } else if (!this.showInXRP && item.assetCode === 'XRP') {
            const total = (item.scaledAmount * this.xrpInUSD).toFixed(
              item.assetScale
            );
            urlMap[item.url] = {
              total: total,
              wentToDeveloper: item.toDeveloper ? item.scaledAmount : 0,
              assetCode: item.assetCode,
              lastUpdate: item.date
            };
          } else {
            urlMap[item.url] = {
              total: item.scaledAmount,
              wentToDeveloper: item.toDeveloper ? item.scaledAmount : 0,
              assetCode: item.assetCode,
              lastUpdate: item.date
            };
          }
        }
      }
      return urlMap;
    }
  },
  watch: {
    async websiteInfoDialog(val) {
      if (val) {
        this.websiteInfoLoading = true;
        const items = await getRecords('paytrackr_history');
        this.selectedWebsiteUrls = items.filter(i =>
          i.url.includes(this.selectedWebsite.hostname)
        );
        this.websiteInfoLoading = false;
      } else {
        this.selectedWebsiteUrls = [];
      }
    }
  }
};
</script>
