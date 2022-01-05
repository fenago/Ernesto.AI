from django.core.management.base import BaseCommand
from django.conf import settings
import subprocess
import time


class Command(BaseCommand):
    help = 'Schedule Scrappers Run'

    def handle(self, *args, **options):
        subprocess.Popen('{0}scrapyd-deploy'.format(settings.SCRAPPER_SCRAPYD_DIR), cwd=settings.SCRAPPER_PROJECT_DIR)
        # subprocess.call(['{0}scrapyd-client'.format(settings.SCRAPPER_SCRAPYD_DIR), 'schedule', '-p', settings.SCRAPPER_PROJECT_NAME, 'dice_jobs','-d job=data -d location=porto'], cwd=settings.SCRAPPER_PROJECT_DIR)

        time.sleep(10)