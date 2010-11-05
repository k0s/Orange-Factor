function(doc) {
  for (orange in doc.oranges) {
    var or = doc.oranges[orange];
    emit([or.platform, or.buildtype, or.test, or.date, or.bug, or.summary], 1);
  }
}
