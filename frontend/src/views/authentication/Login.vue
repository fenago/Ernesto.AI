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
                    <v-form
                      ref="form"
                      v-model="formDetails.isValid"
                      lazy-validation
                    >
                      <v-row class="flex-column">
                        <v-col>
                          <v-text-field
                            v-model="formDetails.model.username"
                            :rules="formDetails.validation.usernameRules"
                            type="text"
                            width="100%"
                            color="primary"
                            label="Username"
                            @keyup.enter="onLogin"
                          />
                        </v-col>
                        <v-col>
                          <v-text-field
                            v-model="formDetails.model.password"
                            :rules="formDetails.validation.passwordRules"
                            type="text"
                            width="100%"
                            color="primary"
                            label="Password"
                            @keyup.enter="onLogin"
                          />
                        </v-col>
                        <v-col>
                          <v-btn
                            :disabled="!formDetails.isValid"
                            :loading="formDetails.isLoading"
                            width="100%"
                            color="primary"
                            @click="onLogin"
                          >
                            Login
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
                    </v-form>
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
// Helpers
  import store from '../../store'

  // Services
  import { authenticationDataService } from '../../services/authenticationDataService'

  export default {
    name: 'LoginPage',
    data () {
      return {
        isLoginAsStudent: false,
        formDetails: {
          isValid: false,
          isLoading: false,
          validation: {
            usernameRules: [
              v => !!v || 'Username is required',
              v =>
                (v && v.length <= 20) ||
                'User name must be less than 20 characters',
            ],
            passwordRules: [
              v => !!v || 'Password is required',
              v =>
                (v && v.length <= 20) ||
                'Password must be less than 20 characters',
            ],
          },
          model: {
            username: '',
            password: '',
          },
        },
      }
    },

    methods: {
      async onLogin () {
        if (!this.isFormValid()) {
          return
        }

        this.formDetails.isLoading = true
        const payload = { ...this.formDetails.model }

        try {
          const response = await authenticationDataService.login(payload)
          const { token } = response

          if (!token) {
            throw 'User is not authorized'
          }

          store.dispatch('user/setToken', token)
          this.$router.push('/')
        } catch (error) {
          console.error(error, 'Failed to get logged in')
        } finally {
          this.formDetails.isLoading = false
        }
      },
      isFormValid () {
        this.formDetails.isValid = this.$refs.form.validate()
        return this.formDetails.isValid
      },
      routeToForgetPassword () {},
      routeToRegister () {},
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
