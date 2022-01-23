export const constants = {
    userTypes: {
        USER: 'user',
        TRAINER: 'trainer',
        CLIENT: 'client',
        ADMIN: 'admin',
    },
    jobStatusMap: {
        FIN: 'Completed',
        RUN: 'In Progress',
    },
    sessionStorageKeys: {
        USER: 'userSession',
    },
    BASE_URL: process.env.VUE_APP_SERVER_BASE_URL,
  }
