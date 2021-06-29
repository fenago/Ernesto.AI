
exports.registerJSONresponse = function (type, status, value) {

	return {
		"type": type,
		"status": status,
		"value": value
	}

}

exports.isValid = function (allowedTypes, value) {

	return allowedTypes.indexOf(value) > -1;

}

