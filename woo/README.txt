Installation:

1) install couchdb + couchapp:
http://github.com/jchris/couchapp/wiki/manual

2) launch couchdb locally

3) create a database on your local couch instance:
3.1) new empty db named: orange_factor
3.2) replicate the data from http://jmaher.couchone.com/orange_factor to a local db named: orange_factor

4) download this project to your local computer (assuming you have git installed):
git clone git@github.com:jmaher/Orange-Factor.git

5) use couchapp to push to localhost:
cd Orange-Factor/woo
couchapp push . http://localhost:5984/orange_factor
