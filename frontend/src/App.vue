<template>
  <v-fade-transition mode="out-in">
    <div>
      <router-view />

      <!-- global notfications -->
      <notifications />
    </div>
  </v-fade-transition>
</template>

<script>
// Styles
  import '@/styles/overrides.sass'

  export default {
    name: 'App',
    metaInfo: {
      title: 'App',
      titleTemplate: '%s | Ernesto.ai',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  }
</script>
