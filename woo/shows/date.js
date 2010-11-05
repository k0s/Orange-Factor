function(doc, req) {
 // !code _attachments/scripts/woo.heatmap.js
 // !code _attachments/scripts/woo.utils.js

  var year = "2010";
  var month = "10";
  var day = "10";
  var today = buildTboxDate(year, month - 1, day);
  var tomorrow = buildTboxDate(year, month - 1, day, 1);
//  return "got date: " + req.query.date + "<br>";
  text, details = displayHeatMap(gApp, "#display", today, tomorrow);
  return text;
}
