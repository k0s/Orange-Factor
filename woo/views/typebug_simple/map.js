function(doc) {
  for (orange in doc.oranges) {
    var or = doc.oranges[orange];
    emit([or.buildtype, or.date, or.platform, or.test, or.bug, or.summary], 1);
  }
}
