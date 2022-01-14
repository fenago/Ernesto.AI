<template>
  <v-main>
    <v-container fluid>
      <div class="px-3">
        <v-card
          elevation="2"
          class="px-2 py-1"
        >
          <v-container fluid>
            <router-view :key="$route.path" />
          </v-container>
        </v-card>
      </div>
    </v-container>
  </v-main>
</template>

<script>
  export default {
    name: 'DefaultView',
  }
</script>
