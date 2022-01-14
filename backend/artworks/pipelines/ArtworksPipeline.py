import csv
import json


class ArtworksPipeline:

    def open_spider(self, spider):
        self.csv_file = open('{0}'.format(spider.filename), 'w')
        
        writer = csv.writer(self.csv_file)
        writer.writerow(["company","description","id","job_type","location","posted_date","salary","position","skills"])


    def process_item(self, item, spider):
        row = dict(item)
        w = csv.DictWriter(self.csv_file, row.keys())
        w.writerow(row)

        return item