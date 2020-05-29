<template>
  <v-app>
    <v-app-bar app flat>
      <v-toolbar-title>Options</v-toolbar-title>
    </v-app-bar>
    <v-content>
      <v-list two-line>
        <v-list-item>
          <v-list-item-action>
            <v-switch></v-switch>
          </v-list-item-action>
          <v-list-item-title>Show payments in XRP</v-list-item-title>
        </v-list-item>
        <v-list-item>
          <v-list-item-action>
            <v-switch></v-switch>
          </v-list-item-action>
          <v-list-item-title>Enable real-time updates (this is resource heavy)</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-content>
  </v-app>
</template>

<script>
import { getRecords, setRecords } from '../utils';
export default {
  name: 'App',
  async created() {
    this.$vuetify.theme.dark = true;
    const theme = await getRecords('paytrackr_theme', 'dark');
    if (theme !== 'dark') {
      this.$vuetify.theme.dark = false;
    }
  }
};
</script>

<style scoped>
p {
  font-size: 20px;
}
</style>
