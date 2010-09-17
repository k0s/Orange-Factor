function(doc) {
  emit([doc.date, doc.pushcount], doc.oranges.length);
}
