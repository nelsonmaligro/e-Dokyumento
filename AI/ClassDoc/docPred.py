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
    from keras.preprocessing.text import Tokenizer
    from keras.models import Sequential, load_model
    from pathlib import Path



    def main(argv):
        #print ('Welcome to the world of Python ',' '.join(argv))
        try:
            argum = ' '.join(argv)


            # For reproducibility
            np.random.seed(1237)

            # These are the labels we stored from our training
            # The order is very important here.

            labels = np.array(['AAR','Bulletin','Circular','Civilian Letter','Conf Notice','Disposition Form','LOI','Letter Directive','Manual','Memorandum','Military Letter','Naval Letter','Radio Message','SOP'])

            # load our saved model
            model = load_model('AI\\ClassDoc\\n6.h5')

            # load tokenizer
            tokenizer = Tokenizer()
            with open('AI\\ClassDoc\\tokenizer.pickle', 'rb') as handle:
                tokenizer = pickle.load(handle)

            test_files = [argum]
            x_data = []
            for t_f in test_files:
                t_f_data = Path(t_f).read_text(encoding='utf-8').replace("\n", " ")
                x_data.append(t_f_data)

            x_data_series = pd.Series(x_data)
            x_tokenized = tokenizer.texts_to_matrix(x_data_series, mode='tfidf')

            i=0
            for x_t in x_tokenized:
                prediction = model.predict(np.array([x_t]))
                predicted_label = labels[np.argmax(prediction[0])]
                sys.stdout.write(predicted_label)
                sys.stdout.flush()
                #sys.stdout.write(predicted_label)
                #sys.stdout.flush()
                i += 1

        except:
            print(sys.exc_info()[0])

except:
   print(sys.exc_info()[0])
   pass


if __name__ == '__main__':
    main(sys.argv[1:])
