#!/usr/bin/python
#-----------------------------------------------------------------------------
# Name:        s7commPlcDataMgr.py 
#
# Purpose:     This module is the data management module to init the S7comm
#              server, Plc internal registers, coils and the PLC ladder logic diagram.
#              It will handle the S7Comm request from the honeypot PLC controller, 
#              read memory address state (input), then calculate the ladder logic and 
#              set the plc memory address (output) in its every clock cycle.
#  
# Author:      Yuancheng Liu
#
# Created:     2024/11/02
# version:     v0.1.1
# Copyright:   Copyright (c) 2024 LiuYuancheng
# License:     MIT License    
#-----------------------------------------------------------------------------

import random
import threading

import s7commPlcGlobal as gv

import snap7Comm
from snap7Comm import BOOL_TYPE, INT_TYPE, REAL_TYPE

from s7LadderLogic import ladderLogic

#-----------------------------------------------------------------------------
#-----------------------------------------------------------------------------
class DataManager(threading.Thread):
    """ Management module running parallel with the main thread to handle all the 
        PLC request and control functions.
    """
    def __init__(self, parent) -> None:
        threading.Thread.__init__(self)

        # Init the plc data handler and permission config

        # Init the s7comm server
        self.server = snap7Comm.s7commServer(snapLibPath=gv.gS7snapDllPath)
        # Init the data reading memory addresses
        self.server.initNewMemoryAddr(1, [0, 2, 4, 6], [BOOL_TYPE, BOOL_TYPE, BOOL_TYPE, BOOL_TYPE])
        self.server.initNewMemoryAddr(2, [0, 2, 4, 6], [BOOL_TYPE, BOOL_TYPE, BOOL_TYPE, BOOL_TYPE])
        # Init the data output memory addresses
        self.server.initNewMemoryAddr(3, [0, 2, 4, 6], [BOOL_TYPE, BOOL_TYPE, BOOL_TYPE, BOOL_TYPE])
        self.server.initNewMemoryAddr(4, [0, 2, 4, 6], [BOOL_TYPE, BOOL_TYPE, BOOL_TYPE, BOOL_TYPE])
        # Init the ladder logic 
        gv.iPlcLadderLogic = ladderLogic(self.server, gv.gLadderID)

        self.terminate = False
        gv.gDebugPrint("PLC data manager init finished.", logType=gv.LOG_INFO)

    #-----------------------------------------------------------------------------
    def run(self):
        """ Thread run() function call by start(). """
        def handlerS7request(parmList):
            """ ladder logic simulation function: when the user set the address Idx=2
                and dataIdx = 4 value, the ladder logic will change the address Idx=2
                dataIdx = 0 's value to the same value.
            """
            gv.iPlcLadderLogic.runLadderLogic(inputData=parmList)
        gv.gDebugPrint('PLC S7Comm server started.', logType=gv.LOG_INFO)
        self.server.startService(eventHandlerFun=handlerS7request)
        gv.gDebugPrint('PLC S7Comm server terminated.', logType=gv.LOG_INFO)

    #-----------------------------------------------------------------------------
    def getPlcStateDict(self):
        """ Return the PLC current input voltage, register value, coil value and 
            output voltage as a dictionary.
        """
        stateDict = {
            'inputVol':[],
            'registerVal':[],
            'coilVal':[],
            'outputVol':[],
	    'flag':''
        }
        dataIdxList = (0, 2, 4, 6)
        # added the input value and voltage
        for idx in dataIdxList:
            stateDict['registerVal'].append(self.server.getMemoryVal(1, idx))
        for idx in dataIdxList:
            stateDict['registerVal'].append(self.server.getMemoryVal(2, idx))
        flg1 = "Find the "  
        flg2 = "correct "
        flg3 = "pin voltage combination"
        cnt = 0
        prevVolt = 1
        for val in stateDict['registerVal']:
            voltage = round(5 + random.uniform(-0.05, 0.05),2) if val else 0 
            stateDict['inputVol'].append(voltage)
            if cnt == 1:
                if voltage == 0: prevVolt = 0
            if cnt == 2 and prevVolt == 0:
                if voltage > 0: flg1 = "flag{"        
                prevVolt = 1
            if cnt == 4: 
                if voltage == 0: prevVolt = 0
            if cnt == 5 and prevVolt == 0:
                if  voltage > 0: flg2 ="G00d_J0B!"
                prevVolt = 1
            if cnt == 6:
                if voltage == 0: prevVolt = 0
            if cnt == 7 and prevVolt == 0: 
                if voltage > 0: flg3 = "_<project author name here>}"
                prevVolt = 1
            cnt = cnt+1
        # added the output value and voltage
        for idx in dataIdxList:
            stateDict['coilVal'].append(self.server.getMemoryVal(3, idx))
        for idx in dataIdxList:
            stateDict['coilVal'].append(self.server.getMemoryVal(4, idx))
        for val in stateDict['coilVal']:
            voltage = round(5 + random.uniform(-0.05, 0.05),2) if val else 0 
            stateDict['outputVol'].append(voltage)
        stateDict['flag'] = flg1+flg2+flg3	
        return stateDict.copy()
