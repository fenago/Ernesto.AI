# -*- coding: utf-8 -*-
import scrapy
from artworks.items import ArtworksItem
import datetime
import re
from scrapy.selector import Selector
from selenium import webdriver
from scrapy.http import TextResponse
from selenium.webdriver.chrome.options import Options


# Any additional imports (items, libraries,..)
# Chrome driver to be installed: https://chromedriver.storage.googleapis.com/index.html?path=93.0.4577.15/


class TrialSpider(scrapy.Spider):
    name = 'dice_jobs'
    option = None
    filename=None

    @staticmethod
    def clean_rawdata(rawData):
        if(rawData):
            rawData = ' '.join(rawData.split())
            return rawData


    def __init__(self, job=None, location=None, filename=None , *args, **kwargs):
        self.pages = 30
        super(TrialSpider, self).__init__(*args, **kwargs)
        self.filename = filename
        self.start_urls = [f'https://www.dice.com/jobs?q={job}&location={location}']

        self.option = Options()
        self.option.add_argument("--disable-infobars")
        self.option.add_argument("start-maximized")
        self.option.add_argument("--disable-extensions")

        # Pass the argument 1 to allow and 2 to block
        self.option.add_experimental_option("prefs", {
            "profile.default_content_setting_values.notifications": 1
        })
        self.option.headless = True
        self.driver = webdriver.Chrome(chrome_options=self.option,executable_path="./chromedriver")


    def parse(self, response):
        for j in range(1, int(self.pages)+1):
            next_page_url = self.start_urls[0] + '&page={}&pageSize=50'.format(j)
            yield scrapy.Request(url=next_page_url, callback=self.parse_page, meta= {'pg': j})


    def parse_page(self, response):
        self.driver = webdriver.Chrome(chrome_options=self.option,executable_path="./chromedriver")
        self.driver.get(response.url)

        urls = []

        response = TextResponse(url=self.driver.current_url, body=self.driver.page_source, encoding='utf-8')
        self.driver.implicitly_wait(60)

        if(response):
            job_details = response.xpath("//a[@class='card-title-link bold']")

            for detail in job_details:
                job_id = detail.xpath('@id').extract_first()
                browse_url = detail.xpath('@href').extract_first()
                yield scrapy.Request(url=browse_url, callback=self.parse_art_work, meta= {'job_id': job_id})


    def parse_art_work(self, response):
        position = response.xpath(
            "//h1[@class='jobTitle']/text()").extract_first()
        company = response.xpath(
            "//li[@class='employer hiringOrganization']//span/text()").extract_first()

        if company:
            location = response.xpath(
                "//li[@class='location']//text()").extract()
            location = self.clean_rawdata(' '.join([x for x in location if x]))
            salary = response.xpath(
                "//div[@class='iconsiblings']/span[@class='mL20']/text()").extract_first()

            description = response.xpath(
                "//div[@class='highlight-black']//text()").extract()
            description = self.clean_rawdata(' '.join([x for x in description if x]))

            job_type = response.xpath(
                "//div[@class='iconsiblings']/span[not(@class)]/text()").extract_first()
            posted_date = response.xpath("//li[@class='posted ']//span/text()").extract_first()
            if posted_date and 'days' in posted_date:
                posted_date = re.search('[0-9]+', str(posted_date)).group()
                posted_date = (datetime.datetime.now() - datetime.timedelta(days=int(posted_date))).strftime('%Y-%m-%d')
            elif posted_date and 'hour' in posted_date:
                posted_date = re.search('[0-9]+', str(posted_date)).group()
                posted_date = (datetime.datetime.now() - datetime.timedelta(hours=int(posted_date))).strftime('%Y-%m-%d')
            skills = response.xpath("(//ul[preceding::*[contains(text(),' Skills')]])[1]//li/text()").extract()
            if not skills:
                skills = response.xpath("(//text()[contains(.,'skills:')])[2]//following-sibling::ul/li/text()").extract()
            if skills:
                skills = ','.join([x for x in skills if x])
            else:
                skills = None
            art_work_item = {
                'company': company,
                'description': description,
                'id': response.meta['job_id'],
                'job_type': job_type,
                'location': location,
                'posted_date':posted_date,
                'salary': salary,
                'position': position,
                'skills': skills
            }
            yield ArtworksItem(art_work_item)
