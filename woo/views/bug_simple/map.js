function(doc) {
  for (orange in doc.oranges) {
    var or = doc.oranges[orange];
    emit([or.date, or.platform, or.buildtype, or.test, or.bug, or.summary], 1);
  }
}
