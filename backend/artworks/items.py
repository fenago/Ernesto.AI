# -*- coding: utf-8 -*-

# Define here the models for your scraped items
#
# See documentation in:
# https://doc.scrapy.org/en/latest/topics/items.html

import scrapy


class ArtworksItem(scrapy.Item):
    company = scrapy.Field()
    position = scrapy.Field()
    location = scrapy.Field()
    description = scrapy.Field()
    job_type = scrapy.Field()
    salary = scrapy.Field()
    id = scrapy.Field()
    posted_date = scrapy.Field()
    skills = scrapy.Field()

