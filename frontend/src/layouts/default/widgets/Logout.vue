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
  // Store
  import store from '../../../store'

  export default {
    name: 'DefaultLogout',
    methods: {
      onLogout () {
        store.dispatch('user/clearToken')
        this.$router.push('/login')
      },
    },
  }
</script>
