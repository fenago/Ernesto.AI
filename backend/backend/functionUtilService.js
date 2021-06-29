function currentDate() {
  var today = new Date();

  var day = String(today.getDate()).padStart(2, "0");
  var month = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  var year = today.getFullYear();

  var todayDisplay =
    ("0000" + year.toString()).slice(-4) +
    "-" +
    ("00" + month.toString()).slice(-2) +
    "-" +
    ("00" + day.toString()).slice(-2);

  return todayDisplay;
}

function lastWeekDate() {
  var today = new Date();

  var lastWeek = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 7
  );

  var lastWeekMonth = lastWeek.getMonth() + 1;
  var lastWeekDay = lastWeek.getDate();
  var lastWeekYear = lastWeek.getFullYear();

  var lastWeekDisplay =
    ("0000" + lastWeekYear.toString()).slice(-4) +
    "-" +
    ("00" + lastWeekMonth.toString()).slice(-2) +
    "-" +
    ("00" + lastWeekDay.toString()).slice(-2);

  return lastWeekDisplay;
}

function currentDateTime() {
  var today = new Date();
  var datetime =
    currentDate() +
    " @ " +
    today.getHours() +
    ":" +
    today.getMinutes() +
    ":" +
    today.getSeconds();

  return datetime;
}

function dayMinusFromTodayDate(days) {
  var today = new Date();

  var minusFromToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - days
  );

  var month = minusFromToday.getMonth() + 1;
  var day = minusFromToday.getDate();
  var year = minusFromToday.getFullYear();

  var displayDate =
    ("0000" + year.toString()).slice(-4) +
    "-" +
    ("00" + month.toString()).slice(-2) +
    "-" +
    ("00" + day.toString()).slice(-2);

  return displayDate;
}

module.exports = { currentDate, lastWeekDate, currentDateTime, dayMinusFromTodayDate };
