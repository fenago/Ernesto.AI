<template>
  <div class="c-job-search">
    <v-card class="px-3 py-2">
      <h3 class="text-center mt-4">
        Search Jobs
      </h3>

      <div class="my-3" />

      <v-form
        ref="form"
        v-model="formDetails.isValid"
        lazy-validation
      >
        <v-row justify="center">
          <v-col cols="4">
            <v-text-field
              v-model="formDetails.model.job"
              :rules="formDetails.validation.jobRules"
              label="Job Title"
              placeholder="Enter Job Title"
              solo
              @keyup.enter="searchJob"
            />
          </v-col>
          <v-col cols="4">
            <v-text-field
              v-model="formDetails.model.location"
              :rules="formDetails.validation.locationRules"
              label="Location"
              placeholder="Enter Job Location"
              solo
              @keyup.enter="searchJob"
            />
          </v-col>
          <v-col cols="1">
            <v-btn
              :disabled="!formDetails.isValid"
              :loading="formDetails.isLoading"
              elevation="2"
              class="mt-1"
              @click="searchJob"
            >
              Search
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-card>

    <div class="py-5" />

    <v-card>
      <v-data-table
        :headers="tableModel.columns"
        :items="tableModel.rows"
        :items-per-page="tableModel.itemsPerPage"
        class="elevation-1"
      >
        <template v-slot:body="{ items }">
          <tbody>
            <tr
              v-for="item in items"
              :key="item.job_id"
            >
              <td
                v-for="column in tableModel.columns"
                :key="column.value"
                :class="{'text-center': column.value !== 'job'}"
              >
                <div v-if="column.value === 'result_status'">
                  {{ jobStatusMap[item[column.value]] }}
                </div>

                <div v-else-if="column.value === 'csv'">
                  <v-btn
                    icon
                    :disabled="!item[column.value]"
                    @click="downloadFile(item[column.value])"
                  >
                    <v-icon>mdi-download</v-icon>
                  </v-btn>
                </div>
                <div v-else>
                  {{ item[column.value] }}
                </div>
              </td>
            </tr>
          </tbody>
        </template>

        <template v-slot:no-data>
          No Data Available
        </template>

        <template v-slot:no-results>
          No Results Available
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script>
// Services
  import { jobSearchDataService } from '../services/job-search/jobSearchDataService'
  import { constants } from '../util/constants'

  export default {
    name: 'JobSearch',
    data: () => {
      return {
        jobStatusMap: constants.jobStatusMap,
        tableModel: {
          itemsPerPage: 10,
          columns: [
            {
              text: 'Job Name',
              value: 'job',
            },
            { text: 'Location', value: 'location', align: 'center' },
            { text: 'Created On', value: 'created_on', align: 'center' },
            { text: 'Status', value: 'result_status', align: 'center' },
            { text: 'Download', value: 'csv', align: 'center' },
          ],
          rows: [],
        },
        formDetails: {
          isValid: false,
          isLoading: false,
          validation: {
            jobRules: [
              v => !!v || 'Job title is required',
              v =>
                (v && v.length <= 20) ||
                'Job title must be less than 20 characters',
            ],
            locationRules: [
              v => !!v || 'Location is required',
              v =>
                (v && v.length <= 20) ||
                'Location must be less than 20 characters',
            ],
          },
          model: {
            job: '',
            location: '',
          },
        },
      }
    },

    created () {
      this.getJobs()
    },
    methods: {
      async getJobs () {
        try {
          const response = await jobSearchDataService.getJobs()

          this.tableModel.rows = (response.data && response.data[0]) || []
        } catch (error) {
          console.log(error, 'Cannot get jobs list')
        }
      },
      async searchJob () {
        if (!this.isFormValid()) {
          return
        }

        this.formDetails.isLoading = true
        const payload = { ...this.formDetails.model }

        try {
          await jobSearchDataService.searchJob(payload)
          this.getJobs()
          this.$notify({ type: 'success', text: 'Job search is scheduled' })
        } catch (error) {
          console.log(error, 'Cannot search job')
        } finally {
          this.formDetails.isLoading = false
        }
      },
      downloadFile (filePath) {
        console.log(filePath)
      },
      isFormValid () {
        this.formDetails.isValid = this.$refs.form.validate()
        return this.formDetails.isValid
      },
    },
  }
</script>

<style lang="scss" scoped>
.c-job-search {
  background-color: white;
}
</style>
