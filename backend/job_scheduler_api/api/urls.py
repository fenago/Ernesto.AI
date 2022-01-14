from django.urls import path
from api.views import ExecuteScrapper, CancelScrapper, ListScrapperDetails, ScrapperStatus


app_name = "api"

urlpatterns = [
    path('execute_scrapper/',ExecuteScrapper.as_view()),
    path('get_status/',ScrapperStatus.as_view(), name = 'get-status'),
    path('cancel_scrappers/',CancelScrapper.as_view(), name = 'cancel-scrappers'),
    path('list_scrappers/',ListScrapperDetails.as_view(), name = 'list-scrappers')]