[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/fenago/job-scrapers/HEAD)
<br />
You can install this project through following command: 

pip install -r requirements.txt

After installing you can run the scrapper using following command to get data in CSV file:

scrapy crawl trial -a job=any_job_type -a location=any_location_string -o filename.csv

example command to run scrappers 

Just replace your spaces in string with %20 and add -a before location like below command:


For Indeed:

scrapy crawl trial -a job="data%20analyst" -a location="fort%20lauderdale" -o indeed_jobs_data.csv


For Dice:

1. Download your system specific file from here: https://chromedriver.storage.googleapis.com/index.html?path=96.0.4664.45/
2. Put the 'chromedriver' file in the root folder and replace the existing chromedriver file if any available there
3. Run the following command for scraping the Dice website:

    scrapy crawl dice_jobs -a job="software%20engineer" -a location="London" -o dice_jobs_data.csv



For Monster:

scrapy crawl monster_jobs -a job="software%20engineer" -a location="London" -o monster_jobs_data.csv



