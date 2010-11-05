function(doc) {
  for (var idx in doc.oranges) {
    var or = doc.oranges[idx];
    emit([doc.date, doc.pushcount, doc.oranges.length, or.platform, or.test, or.buildtype], 1);
  }
}
