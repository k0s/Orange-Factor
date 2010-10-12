function(doc) {
  for (orange in doc.oranges) {
    var or = doc.oranges[orange];
    emit([or.bug], [doc.pushcount, or]);
  }
}
