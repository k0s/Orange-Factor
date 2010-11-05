function(doc) {
  for (orange in doc.oranges) {
    var or = doc.oranges[orange];
    emit([or.platform, or.test, or.date, or.buildtype, or.bug, or.summary], 1);
  }
}
