REST API VM
=================


GET /virtualmachines                   // Get resource group Virtual Machines

---

GET /subscriptions/virtualmachines     // Get All Virtual Machines

---

POST /virtualmachines/start

---

POST /virtualmachines/restart

---

POST /virtualmachines/deallocate

---
POST /virtualmachines/delete

**payload:**

{   
    "virtualmachines": [
            {
            "resourceGroupName": "",
            "vmName": ""
            }
    ]
}


Schedule Cron VM
==================

GET /cron/virtualMachines/:vmName/resourceGroup/:resourceGroupName		 // Get single Virtual Machines cron

---

* Note this is same as cron for containers i-e: /cron/containers/:containerName/resourceGroup/:resourceGroupName

---
PUT /cron/virtualMachines


Cron History VM
==================

---
GET /virtualmachines/cron/history			// Get VM cron history, exactly same as "/containers/cron/history"