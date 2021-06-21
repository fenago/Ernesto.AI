const basicConstantService = require("./basicConstantService");

const basicUtilService = (() => {
  const makeQueryOptions = (page = 1, limit = 0, sort = "") => {
    return {
      limit: +limit,
      skip: Math.abs((+page - 1) * +limit),
      sort: sort
    };
  };

  const makeQueryTextSearchFilter = (query, modelName) => {
    let filters = {}
    Object.entries(query).forEach(entry => {
      const key = entry[0]
      const value = entry[1]
      if (key === 'sort' || key === 'limit' || key === 'page' || key === 'selectedFields') {
        return
      } else if (key === 'searchText') {
        const searchFieldsKeys = basicConstantService.modalSearchKeyMap[modelName]
        searchFieldsKeys.forEach(searchFieldKey => {
          filters[searchFieldKey] = {
            $regex: new RegExp(value, "i")
          }
        })
      } else {
        filters[key] = value
      }
    })
    return filters;
  };

  const makeQueryFieldsSelection = (fields) => {
    if (!fields) {
      return null;
    }
    try {
      fields = fields.substring(1, fields.length - 1);
      fields = fields.split(",");

      if (!fields.length) {
        return null;
      }

      let fieldsString = "";
      fields.forEach((field, index) => {
        field = field.trim();
        if (index + 1 === fields.length) {
          fieldsString += field;
          return;
        }
        fieldsString += field + " ";
      });
      return fieldsString;
    } catch (error) {
      console.error(error);
    }
  };

  const makeQuery = (query, modelName) => {
    const { page, limit, sort, selectedFields } = query;
    return {
      filters: makeQueryTextSearchFilter(query, modelName),
      fields: makeQueryFieldsSelection(selectedFields),
      options: makeQueryOptions(page, limit, sort)
    };
  };

  return {
    makeQuery
  };
})();

module.exports = basicUtilService;
