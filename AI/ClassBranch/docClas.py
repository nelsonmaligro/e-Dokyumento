try:
    import os,getopt,sys,shutil
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
    from tensorflow.keras.callbacks import ModelCheckpoint
    from tensorflow.keras.layers import Activation, Dense, Dropout
    from sklearn.preprocessing import LabelBinarizer
    import sklearn.datasets as skds
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
            maindrv = coldrv.find({}, {"maindrive":1, "_id": 0})
            dbBranch = colbr.find({}, {"name": 1, "_id": 0})
            origpath = maindrv[0]["maindrive"]+"textML"
            #validate training folders and copy to retrainAI
            if not (os.path.exists (origpath + '/retrainAI')): os.mkdir(origpath + '/retrainAI')
            for dir in dbBranch:
                try:
                    #if (os.path.exists(origpath + '/retrainAI/' + dir["name"])): shutil.rmtree(origpath + '/retrainAI/' + dir["name"])
                    if (os.path.exists (origpath + '/' + dir["name"])):
                        try:
                            if (os.path.exists(origpath + '/retrainAI/' + dir["name"])):
                                for files in os.listdir(origpath + '/'+dir["name"]):
                                    shutil.copy2(origpath + '/'+dir["name"]+'/'+files, origpath + '/retrainAI/'+ dir["name"])
                            else: shutil.copytree(origpath + '/'+dir["name"], origpath + '/retrainAI/'+ dir["name"])
                            shutil.rmtree(origpath + '/' + dir["name"])
                        except: pass
                    else:
                        os.mkdir(origpath + '/retrainAI/'+ dir["name"])
                        open(origpath + '/retrainAI/' + dir["name"] + '/file1.txt', 'w').write(dir["name"])
                        open(origpath + '/retrainAI/' + dir["name"] + '/file2.txt', 'w').write(dir["name"])
                        open(origpath + '/retrainAI/' + dir["name"] + '/file3.txt', 'w').write(dir["name"])
                except: pass

            path_train = origpath + '/retrainAI'
            # For reproducibility
            np.random.seed(1237)
            files_train = skds.load_files(path_train, load_content=False)

            label_index = files_train.target
            label_names = files_train.target_names
            label_names = np.sort(label_names)
            labelled_files = files_train.filenames
            data_tags = ["filename","category","content"]
            data_list = []
            # Read and add data from file to a list
            i=0
            for f in labelled_files:
                content = Path(f).read_text(encoding="utf-8",errors='ignore').replace("\n", " ")
                #io.open(f, mode="r", encoding="utf-8",errors='ignore').read().replace("\n", " ")
                data_list.append((f.replace("\\", "/"),label_names[label_index[i]],content))
                i += 1

            # We have training data available as dictionary filename, category, data
            data = pd.DataFrame.from_records(data_list, columns=data_tags)

            # set sizes
            num_labels = len(label_names)
            vocab_size = 15000
            batch_size = 100

            # lets take 80% data as training and remaining 20% for test.
            train_size = int(len(data) * .8)

            train_posts = data['content'][:train_size]
            train_tags = data['category'][:train_size]
            train_files_names = data['filename'][:train_size]


            test_posts = data['content'][train_size:]
            test_tags = data['category'][train_size:]
            test_files_names = data['filename'][train_size:]

            # define Tokenizer with Vocab Size

            tokenizer = Tokenizer(num_words=vocab_size)
            tokenizer.fit_on_texts(train_posts)
            x_train = tokenizer.texts_to_matrix(train_posts, mode='tfidf')
            x_test = tokenizer.texts_to_matrix(test_posts, mode='tfidf')
            encoder = LabelBinarizer()
            encoder.fit(train_tags)

            y_train = encoder.transform(train_tags)
            y_test = encoder.transform(test_tags)
            # this will help to automatically save the best epoch
            checkpoint = ModelCheckpoint(filepath='AI/ClassBranch/n6.h5',
                                         monitor='val_loss',
                                         verbose=1,
                                         save_best_only=True,
                                         mode='min')
            # Initialize the model
            model = Sequential()
            model.add(Dense(512, input_shape=(vocab_size,)))
            model.add(Activation('relu'))
            model.add(Dropout(0.3))
            model.add(Dense(512))
            model.add(Activation('relu'))
            model.add(Dropout(0.3))
            model.add(Dense(num_labels))
            model.add(Activation('softmax'))
            model.summary()
            model.compile(loss='categorical_crossentropy', optimizer='adam', metrics=['accuracy'])
            history = model.fit(x_train, y_train, batch_size=batch_size, epochs=20, verbose=1, validation_split=0.1,callbacks=[checkpoint])


            # Save Tokenizer i.e. Vocabulary
            with open('AI/ClassBranch/tokenizer.pickle', 'wb') as handle:
                pickle.dump(tokenizer, handle, protocol=pickle.HIGHEST_PROTOCOL)
            score = model.evaluate(x_test, y_test, batch_size=batch_size, verbose=1)

            print('Test accuracy:', score[1])

            text_labels = encoder.classes_
            disLen = len(x_test)
            if (len(x_test) > 10) : disLen = 10
            for i in range(disLen):
                prediction = model.predict(np.array([x_test[i]]))
                predicted_label = text_labels[np.argmax(prediction[0])]
                print(test_files_names.iloc[i])
                print('Actual label:' + test_tags.iloc[i])
                print("Predicted label: " + predicted_label)

        except:
            print(sys.exc_info()[0])

    if __name__ == '__main__':
        main(sys.argv[1:])
    
except:
   print(sys.exc_info()[0])
   pass






