# -*- coding: utf-8 -*-
import scrapy
from artworks.items import ArtworksItem
import datetime
import re


# Any additional imports (items, libraries,..)


class TrialSpider(scrapy.Spider):
    name = 'monster_jobs'
    filename=None

    def __init__(self, job=None, location=None,filename=None, *args, **kwargs):
        super(TrialSpider, self).__init__(*args, **kwargs)
        self.filename = filename
        self.start_urls = [f'https://www.monster.com/jobs/search?q={job}&where={location}']

    base_url = 'https://www.monster.com'

    def start_requests(self):
        for url in self.start_urls:
            yield scrapy.Request(url=url)

    def parse(self, response):
        job_details = response.xpath(
            "//a[@data-test-id='svx-job-title']")
        print(len(job_details))
        for detail in job_details:
            job_id = detail.xpath('@id').extract_first()
            browse_url = detail.xpath('@href').extract_first()
            yield scrapy.Request(url=browse_url, callback=self.parse_art_work, meta= {'job_id': job_id})
        # next_page_tab = response.xpath("//a[contains(text(),'»')]/@href").extract_first()
        # if next_page_tab:
        #     next_page_url = self.base_url + next_page_tab
        #     yield scrapy.Request(url=next_page_url, callback=self.parse)

    def parse_art_work(self, response):
        position = response.xpath(
            "//h1[@class='headerstyle__JobViewHeaderTitle-sc-1ijq9nh-5 jSWmz']/text()").extract_first()
        company = response.xpath(
            "//h2[@class='headerstyle__JobViewHeaderCompany-sc-1ijq9nh-6 vYQlO']/text()").extract_first()
        location = response.xpath(
            "//h3[@class='headerstyle__JobViewHeaderLocation-sc-1ijq9nh-4 ccwCAN']/text()").extract_first()
        salary = response.xpath(
            "//div[@data-test-id='svx-jobview-salary-or-companysize']/text()").extract_first()
        description = response.xpath(
            "//p[b[u[contains(text(),'What you will be doing')]]]/following-sibling::p[text()]/text()").extract()
        description = ','.join([x for x in description if x])
        job_type = response.xpath(
            "//p[b[contains(text(),' Position Type : ')]]/following-sibling::text()[1]").extract_first()
        posted_date = response.xpath("//div[@data-test-id='svx-jobview-posted']/text()").extract_first()
        if posted_date and 'days' in posted_date:
            posted_date = re.search('[0-9]+', str(posted_date)).group()
            posted_date = (datetime.datetime.now() - datetime.timedelta(days=int(posted_date))).strftime('%Y-%m-%d')
        skills = response.xpath(
            "//p[b[contains(text(),' Education Desired : ')]]/following-sibling::text()[1]").extract_first()

        if company:
            art_work_item = {
                'company': company,
                'description': description,
                'id': response.meta['job_id'],
                'job_type': job_type,
                'location': location,
                'posted_date': posted_date,
                'salary': salary,
                'position': position,
                'skills': skills
            }
            yield ArtworksItem(art_work_item)
