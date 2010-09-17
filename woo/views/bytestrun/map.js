function(doc) {
  for (orange in doc.oranges) {
    var or = doc.oranges[orange];
    emit([or.test, doc.date], or);
  }
}
