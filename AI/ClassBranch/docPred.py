try:
    import os,getopt,sys
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

    import logging
    logging.getLogger('tensorflow').disabled = True
    def warn(*args, **kwargs):
        pass
    import warnings
    warnings.warn = warn


    import pandas as pd
    import numpy as np
    import pickle
    from tensorflow.keras.preprocessing.text import Tokenizer
    from tensorflow.keras.models import Sequential, load_model
    from pathlib import Path
    import pymongo as db

    def main(argv):
        #print ('Welcome to the world of Python ',' '.join(argv))
        try:
            argum = ' '.join(argv)
            # get Collections from DB
            mongoconek = db.MongoClient("mongodb://localhost")
            colbr = mongoconek["docMS"]["branches"]
            coldrv = mongoconek["docMS"]["settings"]
            # Get drive path and add textML
            maindrv = coldrv.find({}, {"maindrive": 1, "_id": 0})
            dbBranch = colbr.find({}, {"name": 1, "_id": 0})

            path_train = maindrv[0]["maindrive"] + "textML"

            # For reproducibility
            np.random.seed(1237)

            # These are the labels we stored from our training
            branches = []
            for data in dbBranch:
                branches.append(data["name"])
            labels = np.array(branches)
            labels = np.sort(labels)
            #rint (labels)
            # load our saved model
            model = load_model('AI/ClassBranch/n6.h5')

            # load tokenizer
            tokenizer = Tokenizer()
            with open('AI/ClassBranch/tokenizer.pickle', 'rb') as handle:
                tokenizer = pickle.load(handle)

            test_files = [argum]
            x_data = []
            for t_f in test_files:
                t_f_data = Path(t_f).read_text(encoding='utf-8',errors='ignore').replace("\n", " ")
                x_data.append(t_f_data)

            x_data_series = pd.Series(x_data)
            x_tokenized = tokenizer.texts_to_matrix(x_data_series, mode='tfidf')

            i=0
            for x_t in x_tokenized:
                prediction = model.predict(np.array([x_t]))
                predicted_label = labels[np.argmax(prediction[0])]
                sys.stdout.write(predicted_label)
                sys.stdout.flush()
                i += 1

        except:
            print(sys.exc_info()[0])

    if __name__ == '__main__':
        main(sys.argv[1:])

except:
   print(sys.exc_info()[0])
   pass



