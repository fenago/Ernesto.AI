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
        :loading="tableModel.isLoading"
        class="elevation-1"
      >
        <template v-slot:top>
          <v-btn
            icon
            :disabled="tableModel.isLoading"
            @click="getJobs"
          >
            <v-icon>mdi-restart</v-icon>
          </v-btn>
        </template>
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

                <div v-else-if="column.value === 'actions'">
                  <v-btn
                    icon
                    :disabled="isJobRunning(item.result_status)"
                    @click="getJob(item)"
                  >
                    <v-icon>mdi-download</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    :disabled="isJobCompleted(item.result_status)"
                    :key="item.job_id"
                    @click="cancelJob(item)"
                  >
                    <v-icon>mdi-cancel</v-icon>
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
        isLoading: false,
        isDownloading: false,
        itemsPerPage: 10,
        columns: [
          {
            text: 'Job Name',
            value: 'job',
          },
          { text: 'Location', value: 'location', align: 'center' },
          { text: 'Created On', value: 'created_on', align: 'center' },
          { text: 'Status', value: 'result_status', align: 'center' },
          { text: 'Actions', value: 'actions', align: 'center' },
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
    async searchJob () {
      if (!this.isFormValid()) {
        return
      }

      this.formDetails.isLoading = true
      const payload = { ...this.formDetails.model }

      try {
        await jobSearchDataService.searchJob(payload)
        this.resetForm()
        this.getJobs()
        this.$notify({ type: 'success', text: 'Job search is scheduled' })
      } catch (error) {
        console.log(error, 'Cannot search job')
      } finally {
        this.formDetails.isLoading = false
      }
    },
    async getJobs () {
      this.tableModel.isLoading = true
      this.tableModel.rows = []

      try {
        const response = await jobSearchDataService.getJobs()
        this.tableModel.rows = (response.data && response.data[0]) || []
      } catch (error) {
        console.log(error, 'Cannot get jobs list')
      } finally {
        this.tableModel.isLoading = false
        this.$notify({ type: 'error', text: 'Cannot get jobs list' })
      }
    },
    async getJob ({ job_id }) {
      this.tableModel.isDownloading = true

      try {
        const response = await jobSearchDataService.getJob(job_id)
        const { csv_path: csvPath } = response.data || {}
        this.downloadFile(csvPath)
        this.$notify({ type: 'error', text: 'File downloaded successfully' })
      } catch (error) {
        console.log(error, 'Cannot get job details')
        this.$notify({ type: 'error', text: 'Cannot download file' })
      } finally {
        this.tableModel.isDownloading = false
      }
    },
    async cancelJob ({ job_id }) {
      try {
        const response = await jobSearchDataService.cancelJob(job_id)
        const message = response.data || "Job cancelled successfully"
        this.$notify({ type: 'success', text: message })
      } catch (error) {
        console.log(error, 'Cannot cancel job')
        this.$notify({ type: 'error', text: 'Cannot cancel job' })
      }
    },
    downloadFile (path) {
      if (!path) {
        this.$notify({ type: 'error', text: 'File not found' })
        return
      }
      const a = document.createElement("a");
      a.href = path
      a.download = 'searched-jobs.csv'
      a.click()
    },
    isFormValid () {
      this.formDetails.isValid = this.$refs.form.validate()
      return this.formDetails.isValid
    },
    resetForm () {
      this.formDetails.model = {
        job: '',
        location: '',
      }
      this.$refs.form.reset()
    },
    isJobRunning (jobStatus) {
      return jobStatus === 'RUN'
    },
    isJobCompleted (jobStatus) {
      return jobStatus === 'FIN'
    }
  },
}
</script>

<style lang="scss" scoped>
// .c-job-search {
//   background-color: white;
// }
</style>
