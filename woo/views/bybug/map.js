function(doc) {
  for (orange in doc.oranges) {
    var or = doc.oranges[orange];
    emit([doc.date, or.bug], or);
  }
}
