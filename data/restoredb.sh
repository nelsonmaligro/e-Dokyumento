if [ $(mongo mongo:27017 --eval 'db.getMongo().getDBNames().indexOf("docMS")' --quiet) -lt 0 ]
then  
  mongorestore --host mongo --db docMS --archive=/edokyu/data/data.dmp 
  echo "blank"
else
  echo "exist"
fi
