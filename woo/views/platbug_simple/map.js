function(doc) {
  for (orange in doc.oranges) {
    var or = doc.oranges[orange];
    emit([or.platform, or.date, or.buildtype, or.test, or.bug, or.summary], 1);
  }
}
