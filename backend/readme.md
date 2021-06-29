### Run Application

- Place env.list in current directory
- Use VScode to start Debugging

### Backend

- Serves html/css/javascript present in public folder.
- Communicates with azure REST api's.


### Azure AD user fields mapping

Azure AD user metadata, some fields are being for different purposes:

- givenName ========> resourceGroupName
- surname ========> stripeCustomerId
- streetAddress ========> userType


### Environment Variables

- **subscriptionId** Azure subscriptionId

- (To Call Azure REST API) https://www.youtube.com/watch?v=fh37VQ3_exk&feature=emb_logo 

	* **clientId**
	* **clientSecret**
	* **tenantId** Tennant ID


- Register New App https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps
	* Certificates & secrets (create secret)
	* **webauth_clientId*
	* **webauth_clientSecret*


- **redirectUrl** http://localhost:8080
- **billingAccountId**
- **stripeAPIKey**

