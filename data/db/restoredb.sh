#! /bin/sh
#$ans = $(mongo mongo:27017 --eval 'db.getMongo().getDBNames().indexOf("docMS")' --quiet)
#anser = `whoami` 
#sleep 10
#echo `(mongo mongo:27017 --eval 'db.getMongo().getDBNames().indexOf("docMS")' --quiet`)
if [ $(mongo mongo:27017 --eval 'db.getMongo().getDBNames().indexOf("docMS")' --quiet) -lt 0 ]
then  
  mongorestore --host mongo --db docMS --archive=data/data.dmp 
  echo "blank"
else
  echo "exist"
fi
#if [ 1 == 1 ]; then echo "good" ; fi
#  mongorestore --host mongo --db docMS --archive=data/data.dmp 
#else
#  echo "exist"
#fi