function(doc) {
  for (orange in doc.oranges) {
    var or = doc.oranges[orange];
    emit([or.buildtype, or.test, or.date, or.platform, or.bug, or.summary], 1);
  }
}
