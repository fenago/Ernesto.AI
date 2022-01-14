from django.db import models
from api.choices import *
from django.utils.timezone import now

# Create your models here.
scrapper_choices = ScrapperChoices()

class ScrapperDetails(models.Model):
    job_id = models.CharField(max_length=4096)
    job = models.CharField(max_length=4096)
    location = models.CharField(max_length=4096)
    created_on = models.DateTimeField(default=now)
    csv_path = models.CharField(max_length=1024, blank=True, null=True)
    result_status = models.CharField(max_length=3,
                                     choices=scrapper_choices.RESULT_STATUS_CHOICES,
                                     default="PEN")

    class Meta:
        managed = True
        db_table = 'scrappers_details'