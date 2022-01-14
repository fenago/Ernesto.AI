# scrappers_Api
You can install this project through following command:

pip install -r requirements.txt

After installing you should have to run the scrapyd server using command:

scrapyd (through job-scrappers repository)

After that you have to run the server of scrapper_Api through following commands:

python manage.py runserver


Following below are the end_points, input and output parameters,
   
   1. endpoint:/api-token-auth/
      description: It will return the token of an autherized person
      request_type = POST
      input: username = ernesto, password = ernesto123 
      output: {
                "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImVybmVzbyIsImV4cCI6MTY0MTQwNjI3MSwiZW1haWwiOiIiLCJvcmlnX2lhdCI6MTY0MTM3MDI3MX0.20TPZkT70MAJP490pHLg_qN3RMCYEDis4MsIHg3i8TQ"
              }

   2. endpoint: /api/execute_scrapper/
      description: It will schedule the scrapper and return job_id, status
      request_type = POST
      input: job = data%20analyst , Location = fort%20lauderdale
      output: {
                "error": "",
                "error_code": "",
                "data": {
                    "job_id": "eaa2c7f86dfb11ecb4923fcad7eb9b63",
                    "status": "RUN"
                }
            }
   
   3. endpoint: /api/get_status/
      description: It will return the status, csv_path of provided job_id and save the updated status.
      request_type = POST
      input: job_id = eaa2c7f86dfb11ecb4923fcad7eb9b63
      output: {
                "error": "",
                "error_code": "",
                "data": {
                    "status": "FIN",
                    "csv_path": "/home/scrappers_Api/job_scheduler_api/media/accepted_csv/1641394126_dice_jobs.csv"
                }
            }

   4. endpoint: /api/list_scrappers/
      description: It will return the list of scrappers. 
      request_type = GET
      output: {
                "error": "",
                "error_code": "",
                "data": [
                    [
                        {
                            "job_id": "59eaf6e86df811ecb4923fcad7eb9b63",
                            "job": "data analyst",
                            "location": "fort lauderdale",
                            "created_on": "2022-01-05T07:23:26.973748Z",
                            "result_status": "RUN"
                        },
                        {
                            "job_id": "eaa2c7f86dfb11ecb4923fcad7eb9b63",
                            "job": "data%20analyst",
                            "location": "fort lauderdale",
                            "created_on": "2022-01-05T07:48:58.275299Z",
                            "result_status": "FIN"
                        }
                    ]
                ]
            }
    
    5. endpoint: /api/cancel_scrappers/
       description: It will cancel the scheduled scrapper against provided job_id. 
       request_type = POST
       input: job_id = eaa2c7f86dfb11ecb4923fcad7eb9b63
       output: {
                "error": "",
                "error_code": "",
                "data": "Job cancelled successfully....!"
            }
    
    6. endpoint: /api/scrappers_statuses/
       description: It will return the statuses of given job_id list as well as the error.
       request_type = POST
       input: {"job_ids":["10f8268c748c11eca5674b826a2bb450","10f8268c748c11eca5674b826a2bb450","59eaf6e86df811ecb4923fcad7eb9b63"]}
       output: {
                "error": "",
                "error_code": "",
                "data": {
                    "status": [
                        {
                            "job_id": "10f8268c748c11eca5674b826a2bb450",
                            "status": "FIN",
                            "error": ""
                        },
                        {
                            "job_id": "10f8268c748c11eca5674b826a2bb450",
                            "status": "FIN",
                            "error": ""
                        },
                        {
                            "job_id": "59eaf6e86df811ecb4923fcad7eb9b63",
                            "status": "",
                            "error": "Given job id does not exist"
                        }
                    ]
                }
            }