import eel
import random
import socket
import argparse
import poi_lib

# host = socket.gethostbyname(socket.gethostname())
# print(host)

parser = argparse.ArgumentParser()

parser.add_argument('--host', default="192.168.0.208")

args = parser.parse_args()


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
def new_event_ID(new_POI_id_):
    event_id_list_this_poi_ = []
    charlist = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
    retval = new_POI_id_ + "_event_"
    for i in range(10):
        retval += random.choice(charlist)
    while retval in event_id_list_this_poi_:
        newval = new_POI_id_ + "_event_"
        for i in range(10):
            newval += random.choice(charlist)
        retval = newval
    return retval

@eel.expose
def new_ent_ID(new_POI_id_):
    ent_id_list_this_poi_ = []
    charlist = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
    retval = new_POI_id_ + "_ent_"
    for i in range(10):
        retval += random.choice(charlist)
    while retval in ent_id_list_this_poi_:
        newval = new_POI_id_ + "_ent_"
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

    formaldict = {'name':'Name', 
                    'gender':'Gender', 
                    'dob':'DOB', 
                    'nationality':'Nationality', 
                    'id number': "ID Number",
                    'location': "Location",
                    'occupation': "Occupation",
                    'education': "Education",   
                    'languages': "Languages"
    }
    to_add_keys = []
    to_add_values = []

    for i in range(len(keylist)):
        if keylist[i].lower() in formaldict:
            keylist[i] = formaldict[keylist[i].lower()]
    keylist_lower = [n.lower() for n in keylist]
    for k, v in formaldict.items():
        if k.lower() not in keylist_lower:
            to_add_keys.append(formaldict[k.lower()])
            to_add_values.append('UNKNOWN') 
    keylist.extend(to_add_keys)
    vallist.extend(to_add_values)
    # for i in range(len(keylist)):
    #     print(keylist[i], vallist[i])
    return keylist, vallist

@eel.expose
def receive_poi(JSON_POI_):
    parsed_poi = poi_lib.deserialize_poi(JSON_POI_)

eel.start("index.html", size=(1600, 900), mode="chromium", host=args.host)