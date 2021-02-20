service mongodb start
if [ $(mongo localhost:27017 --eval 'db.getMongo().getDBNames().indexOf("docMS")' --quiet) -lt 0 ]
then  
  mongorestore --host localhost --db docMS --archive=/edokyu/data/data.dmp 
  echo "blank"
else
  echo "exist"
fi
