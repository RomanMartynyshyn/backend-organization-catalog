# REST API

### /api/organizations
* GET - list all ogranizations, ?query=<name>&categories=medical,education&limit=20&offset=60
returns response with array of `Organisation` objects

* POST - create new organization
request - `Organisation` object
response - `Organisation` object (with tecnical fields, id, ...)

### /api/organizations/:id
* GET - retrieve an organization by ID
response - `Organisation` object

* PUT - replace organization fields with new values, only editable fields (edit whole object)

* PATCH - edit particular fields of the object ???

* DELETE - remove organization (archive?)

* POST - create something associates with an organisation

### /api/organizations/:id/state   // URI of a `state` attribute of a particular organisation
* PUT - change state. Admin only

### /api/organizations/:id/approve  // ACTION!!! NOT A URI, NOT A RESOURCE
### /api/organizations/:id/reject   // Violates REST principles
* POST - executes an action, is not REST

### /api/organizations/:id/branches
* GET - branch list

* POST - new branch

### /api/organizations/:id/branches/:branchid
* 

### /api/dictionaries/categories
### /api/dictionaries/regions
* GET - list

### /api/organizations/import
* POST - bulk import organizations