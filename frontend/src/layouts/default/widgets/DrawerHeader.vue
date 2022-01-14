<template>
  <v-list-item class="mb-0 justify-space-between pl-3">
    <!-- <v-list-item-avatar>
      <v-img
        :src="
          require('@/assets/vmd.svg')"
      />
    </v-list-item-avatar> -->

    <v-list-item-content
      style="text-align: center;"
      class="pl-2"
    >
      <v-list-item-title class="text-h3">
        <strong class="mr-1 font-weight-black">ERNESTO</strong>

        <span class="primary--text">AI</span>
      </v-list-item-title>
    </v-list-item-content>
  </v-list-item>
</template>

<script>
  // Utilities
  import { get } from 'vuex-pathify'

  export default {
    name: 'DefaultDrawerHeader',

    computed: { version: get('app/version') },
  }
</script>
