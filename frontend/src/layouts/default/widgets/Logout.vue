<template>
  <v-btn
    class="ml-2"
    min-width="0"
    text
    exact
    @click="onLogout"
  >
    <v-icon>mdi-logout-variant</v-icon>
  </v-btn>
</template>

<script>
  // services
  import store from '../../../store/index'
  import { baseUrl } from '../../../util/helpers'

  export default {
    name: 'DefaultLogout',
    methods: {
      onLogout () {
        store.dispatch('user/clearSession')
        location.assign(`${baseUrl()}/logout`)
      },
    },
  }
</script>
