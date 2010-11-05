function(doc) {
  for (orange in doc.oranges) {
    var or = doc.oranges[orange];
    emit([or.test, or.date, or.platform, or.buildtype, or.bug, or.summary], 1);
  }
}
