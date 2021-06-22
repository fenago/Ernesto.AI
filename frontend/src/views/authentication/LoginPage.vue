<template>
  <v-app>
    <div class="c-login-page">
      <v-container class="fill-height">
        <v-row
          align="center"
          justify="center"
        >
          <v-col cols="6">
            <div>
              <h2 class="font-bold">
                Welcome to Ernesto.ai
              </h2>

              <p>With Ernesto.ai, you will learn by actually doing.</p>

              <p>
                You can't learn to ride a bike by reading about riding a bike and
                neither can you learn high tech by just reading about it.
              </p>

              <p>
                Ernesto.ai provides zero install cloud based hands-on labs so that you
                can learn by doing. Learn real skills that are in demand such as:
                Data Science, Big Data, Cyber Sec, DevOps, DevSecOps, Programming,
                Blockchain, and much more.
              </p>
            </div>
          </v-col>
          <v-col cols="6">
            <v-card height="270">
              <v-card-title>
                <h4>ERNESTO.AI</h4>
              </v-card-title>
              <v-card-text>
                <div>
                  <v-btn
                    color="primary"
                    @click="onLoginWithAzureAD"
                  >
                    Login as Admin/Instructor
                  </v-btn>

                  <!-- extras -->
                  <a @click="routeToForgetPassword">
                    <small>Forgot password?</small>
                  </a>
                  <p class="text-muted text-center">
                    <small>Do not have an account?</small>
                  </p>
                  <a
                    class="btn btn-sm btn-white btn-block"
                    @click="routeToRegister"
                  >Create an account</a>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-divider />
        <v-row>
          <v-col>
            <small>ERNESTO.AI</small>
          </v-col>
          <v-col class="text-right">
            <small>&copy; {{ (new Date()).getFullYear() }}</small>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </v-app>
</template>

<script>
  import { baseUrl } from '../../util/helpers'

  export default {
    name: 'LoginPage',
    data () {
      return {
        isLoginAsStudent: false,
      }
    },
    methods: {
      onLoginWithAzureAD () {
        location.assign(`${baseUrl()}/login`)
      },
    },
  }
</script>

<style lang="scss" scoped>

</style>
