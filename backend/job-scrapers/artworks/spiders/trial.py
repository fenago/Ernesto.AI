# -*- coding: utf-8 -*-
import scrapy
from artworks.items import ArtworksItem
import datetime
import re


# Any additional imports (items, libraries,..)


class TrialSpider(scrapy.Spider):
    name = 'trial'
    filename=None
    
    def __init__(self, job=None, location=None,filename=None, *args, **kwargs):
        super(TrialSpider, self).__init__(*args, **kwargs)
        self.filename = filename
        self.start_urls = [f'https://indeed.com/jobs?q={job}&l={location}']

    base_url = 'https://www.indeed.com'

    def start_requests(self):
        for url in self.start_urls:
            yield scrapy.Request(url=url)

    def parse(self, response):
        job_details = response.xpath(
            '//div[contains(@class, "mosaic mosaic-provider-jobcards")]/a[@id]')
        print(len(job_details))
        for detail in job_details:
            job_id = detail.xpath('@id').extract_first().split('_')[1]
            browse_url = self.base_url + detail.xpath('@href').extract_first()
            yield scrapy.Request(url=browse_url, callback=self.parse_art_work, meta= {'job_id': job_id})
        next_page_tab = response.xpath('//a[contains(@aria-label, "Next")]/@href').extract_first()
        if next_page_tab:
            next_page_url = self.base_url + next_page_tab
            yield scrapy.Request(url=next_page_url, callback=self.parse)

    def parse_art_work(self, response):
        position = response.xpath(
            '//div[contains(@class, "jobsearch-JobInfoHeader-title-container jobsearch-JobInfoHeader-title-containerEji")]/h1/text()').extract_first()
        company = response.xpath(
            '//div[contains(@class, "jobsearch-InlineCompanyRating icl-u-xs-mt--xs jobsearch-DesktopStickyContainer-companyrating")]//a/text()').extract_first()
        location = response.xpath(
            '//div[@class = "icl-u-xs-mt--xs icl-u-textColor--secondary jobsearch-JobInfoHeader-subtitle jobsearch-DesktopStickyContainer-subtitle"]//div[not(@class)]/text()').extract_first()
        try:
            salary = response.xpath(
                '//div[contains(text(), "Salary")]//following-sibling::span[1]/text()').extract_first()
        except:
            salary = response.xpath(
                '//div[contains(@id, "coinfp-estimatedSalaries-panel")]//ul[@data-testid="estimated-salary"]//text()').extract()
        description = response.xpath('//div[contains(@id, "jobDescriptionText")]//text()').extract()
        description = ' '.join(description)
        try:
            job_type = response.xpath(
                '//div[contains(text(), "Job Type")]//following-sibling::div[1]/text()').extract_first()
        except:
            job_type = response.xpath(
                '//div[contains(@class, "jobsearch-JobMetadataHeader-item ")]/span/text()').extract_first()
        posted_date = response.xpath('//div[contains(text(), "days ago")]/text()').extract_first()
        if posted_date:            
            posted_date = re.search('[0-9]+', str(posted_date)).group()
            posted_date = (datetime.datetime.now() - datetime.timedelta(days=int(posted_date))).strftime('%Y-%m-%d')
        if company:
            art_work_item = {
                'company': company,
                'description': description,
                'id': response.meta['job_id'],
                'job_type': job_type,
                'location': location,
                'posted_date':posted_date,
                'salary': salary,
                'position': position,
                'skills': None
            }
            yield ArtworksItem(art_work_item)
