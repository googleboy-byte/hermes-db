import eel
import random

eel.init("hermes_fend")

@eel.expose
def newPOIID(existing_val_list=[]):
    charlist = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
    retval = ""
    for i in range(10):
        retval += random.choice(charlist)
    while retval in existing_val_list:
        newval = ""
        for i in range(10):
            newval += random.choice(charlist)
        retval = newval
    return retval

@eel.expose
def parse_basicdets(content):
    contentlist = content.split("\n")
    keylist, vallist = [], []
    for mapping in contentlist:
        if mapping.count(":") == 1:
            keylist.append(mapping.split(":")[0])
            vallist.append(mapping.split(":")[1])

    return keylist, vallist

eel.start("index.html", size=(1600, 900), mode="chromium")