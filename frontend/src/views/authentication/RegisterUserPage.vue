<template>
  <div class="gray-bg full-height">
    <div
      v-if="status !== basicConstantsService.status.loading"
      class="middle-box text-center loginscreen animated fadeInDown"
    >
      <div>
        <h3>Register to Fenago Containers</h3>
        <p>Create account to see it in action.</p>
        <form
          class="needs-validation"
          novalidate
          @submit.prevent="onSubmit"
        >
          <div class="form-group">
            <input
              v-model="name"
              type="text"
              class="form-control"
              placeholder="Display Name"
              required
            >
          </div>
          <div class="form-group">
            <input
              v-model="phone"
              type="text"
              class="form-control"
              placeholder="Mobile Phone"
              required
            >
          </div>
          <div class="form-group">
            <input
              v-model="company"
              type="text"
              class="form-control"
              placeholder="Client Company"
              required
            >
          </div>
          <!-- <div class="form-group">
            <input
              v-model="location"
              type="text"
              class="form-control"
              placeholder="Office Location"
              required
            />
          </div>-->
          <div class="form-group">
            <input
              v-model="userAccount"
              type="text"
              class="form-control"
              placeholder="User Account"
              required
            >
            <strong>@gei411gmail.onmicrosoft.com</strong>
          </div>
          <!-- <div class="row">
          <div class="col-sm-12">-->
          <div class="form-group">
            <input
              id="password"
              v-model="password"
              class="form-control example1"
              placeholder="Password"
              type="password"
              pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,64}$"
            >
            <strong>Password must be greater than 8 characters i.e. contains atleast
              1 of uppercase, lowercase, special character and digit</strong>
          </div>
          <div class="form-group">
            <input
              id="confirm_password"
              v-model="confirmPassword"
              class="form-control example1"
              placeholder="Confirm Password"
              type="password"
              pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,64}$"
            >
          </div>
          <div class="form-group">
            <select v-model="language">
              <option value="en-US">
                English(US)
              </option>
              <option value="en-UK">
                English(UK)
              </option>
              <option value="es-ES">
                Spanish
              </option>
              <option value="en-US">
                Other
              </option>
            </select>
          </div>
          <!-- <div class="form-group">
            <label>Password Change Policy (NextSignIn)</label>
            <br />

            <input
              class="policyBool policyBool1"
              v-model="policy"
              type="radio"
              value="true"
            />
            <label>True</label>

            <input class="policyBool policyBool2" v-model="policy" type="radio" value="false" checked/>
            <label>False&nbsp;</label>
          </div> -->

          <button
            type="submit"
            class="btn btn-primary block full-width m-b"
          >
            Register
          </button>

          <p class="text-muted text-center mt-2">
            <small>Already have an account?</small>
          </p>
        </form>
        <a
          class="btn btn-sm btn-white btn-block"
          @click="clickLogin"
        >Login</a>
        <p class="m-t">
          <small>Fenago Containers &copy; 2020</small>
        </p>
      </div>
    </div>

    <spinner-loader
      v-if="status === basicConstantsService.status.loading"
      color="#f49200"
      class="spinner"
    />
  </div>
</template>

<script>
  // import { SpinnerLoader } from 'vue-spinners-css'
  // import axios from '../../../services/axiosService'
  // import { toastedNotificationService } from '../../../services/toastedNotificationService'
  // import { basicConstantsService } from '../../../services/basicConstantsService'

  export default {
    name: 'Register',
    // components: { SpinnerLoader },
    // data () {
    //   return {
    //     name: '',
    //     phone: '',
    //     company: '',
    //     location: '',
    //     userAccount: '',
    //     password: '',
    //     confirmPassword: '',
    //     language: 'en-US',
    //     policy: 'true',
    //     passwordField: undefined,
    //     confirmPasswordField: undefined,
    //     basicConstantsService: basicConstantsService,
    //     status: basicConstantsService.status.none,
    //   }
    // },
    // watch: {
    //   password () {
    //     const self = this
    //     self.doesPasswordMatch()
    //   },
    //   confirmPassword () {
    //     const self = this
    //     self.doesPasswordMatch()
    //   },
    // },
    // methods: {
    //   async onSubmit () {
    //     const self = this

    //     self.status = basicConstantsService.status.loading

    //     var form = document.getElementsByClassName('needs-validation')[0]

    //     // if (self.name === "") {
    //     //   self.status = basicConstantsService.status.fail;
    //     //   toastedNotificationService.showInfo(`Name cannot be empty`);
    //     // } else if (self.phone === "") {
    //     //   self.status = basicConstantsService.status.fail;
    //     //   toastedNotificationService.showInfo(`Mobile number cannot be empty`);
    //     // } else if (self.company === "") {
    //     //   self.status = basicConstantsService.status.fail;
    //     //   toastedNotificationService.showInfo(`Company cannot be empty`);
    //     // } else if (self.location === "") {
    //     //   self.status = basicConstantsService.status.fail;
    //     //   toastedNotificationService.showInfo(`Location cannot be empty`);
    //     // } else if (self.userAccount === "") {
    //     //   self.status = basicConstantsService.status.fail;
    //     //   toastedNotificationService.showInfo(`Account cannot be empty`);
    //     // } else if (self.password === "") {
    //     //   self.status = basicConstantsService.status.fail;
    //     //   toastedNotificationService.showInfo(`Password cannot be empty`);
    //     // } else if (self.password === self.confirmPassword) {
    //     //   self.status = basicConstantsService.status.fail;
    //     //   toastedNotificationService.showInfo(` cannot be empty`);
    //     // }

    //     if (form.checkValidity() !== false) {
    //       const payload = {
    //         displayName: self.name,
    //         mobilePhone: self.phone,
    //         company: self.company,
    //         officeLocation: self.location,
    //         userPrincipalName: self.userAccount,
    //         password: self.password,
    //         confirm_password: self.confirmPassword,
    //         preferredLanguage: self.language,
    //         pcSelector: self.policy,
    //       }

    //       await axios
    //         .post('/signup', payload)
    //         .then(() => {
    //           this.$router.push('/login')
    //           self.status = basicConstantsService.status.success
    //           toastedNotificationService.showSuccess(
    //             'User successfully created, Please login to continue',
    //           )
    //         })
    //         .catch(err => {
    //           this.$router.push('/login')
    //           self.status = basicConstantsService.status.fail
    //           if (err.response && err.response.status) {
    //             switch (err.response.status) {
    //               case 400:
    //                 toastedNotificationService.showError(
    //                   err.response.data.error ||
    //                     'Username is invalid or not available',
    //                 )
    //                 break
    //               case 500:
    //                 toastedNotificationService.showError(
    //                   err.response.data.error || 'Failed to register client',
    //                 )
    //                 break
    //               default:
    //                 break
    //             }
    //           } else {
    //             toastedNotificationService.showError('Error while creating user')
    //           }
    //         })
    //     } else {
    //       self.status = basicConstantsService.status.fail
    //       toastedNotificationService.showError('Fields are not filled correctly')
    //     }

    //     form.classList.add('was-validated')
    //   },
    //   clickLogin () {
    //     this.$router.push('/login')
    //   },
    //   doesPasswordMatch () {
    //     const self = this

    //     self.passwordField = document.getElementById('password')
    //     self.confirmPasswordField = document.getElementById('confirm_password')

    //     if (self.passwordField.value !== self.confirmPasswordField.value) {
    //       self.confirmPasswordField.setCustomValidity('Password did not match')
    //     } else {
    //       self.confirmPasswordField.setCustomValidity('')
    //     }
    //   },
    // },
  }
</script>

<style scoped>
.spinner {
  left: 48vw;
  top: 45vh;
}

.error-message {
  color: red;
}

.form-group {
  text-align: left;
}

.policyBool {
  margin-right: 6px;
}

.policyBool2 {
  margin-left: 12px;
}
</style>
