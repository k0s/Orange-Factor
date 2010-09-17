function(doc) {
//TODO: remove the hardcoded aug 10, 2010 date
  var today = new Date(2010,8,10);
  yesterday = new Date(Date.parse(today) - (1*(60*60*24*1000)));

  var month = yesterday.getMonth();
  var day = yesterday.getDate();
  if (day < 10) day = "0" + day;

  if (month < 10) month = "0" + month;
  var yesterday_format = yesterday.getFullYear() + "-" + month + "-" + day;
  if (doc.date == yesterday_format) {
    emit(doc.date, doc);
  }
}
