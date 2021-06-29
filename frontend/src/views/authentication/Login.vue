<template>
  <v-app>
    <div class="c-login-page">
      <v-container class="fill-height">
        <v-row
          align="center"
          justify="center"
        >
          <v-col>
            <v-row justify="center">
              <v-col
                class="welcome-content"
                cols="7"
              >
                <h2 class="font-bold mb-3">
                  Welcome to Ernesto.ai
                </h2>
                <div class="text--disabled">
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
              <v-col cols="5">
                <v-card>
                  <v-row justify="center">
                    <v-card-title>
                      <h3>ERNESTO.AI</h3>
                    </v-card-title>
                  </v-row>
                  <v-card-text class="text-center pt-8">
                    <v-row
                      class="flex-column"
                    >
                      <v-col>
                        <v-btn
                          width="100%"
                          color="primary"
                          @click="onLoginWithAzureAD"
                        >
                          Login as Admin/Instructor
                        </v-btn>
                      </v-col>
                      <v-col>
                        <v-btn
                          text
                          x-small
                          plain
                          color="secondary"
                          class="font-weight-medium"
                          @click="routeToForgetPassword"
                        >
                          Forgot password?
                        </v-btn>
                      </v-col>
                      <v-col>
                        <span class="d-block">
                          <small>Do not have an account?</small>
                        </span>
                        <v-btn
                          text
                          small
                          plain
                          color="secondary"
                          class="font-weight-medium"
                          @click="routeToRegister"
                        >
                          Create an account
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
            <v-divider class="mt-5 mb-6" />
            <v-row>
              <v-col>
                <small>ERNESTO.AI</small>
              </v-col>
              <v-col class="text-right">
                <small>&copy; {{ (new Date()).getFullYear() }}</small>
              </v-col>
            </v-row>
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
.c-login-page {
  .container {
    height: 70vh;

    .row {
      .col {
        max-width: 850px;
        .row {
          .welcome-content {
            p {
              font-size: 14px;
            }
          }
        }
      }
    }
  }
}
</style>
