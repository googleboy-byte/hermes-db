export class POI{
    constructor(poiid, basicdets=null, reporttext=null, imagefiles=null, files=null, key=null){
        // basicdets = {
        //     detlabel : [value, [attached_files]]
        // }
        // eventdets = {
        //     eventname: [eventdatetime, eventplace, eventdescription, [attached_files]]
        // }
        // reporttext = "report text"
        // imagefiles = {
        //     imagefilehash : [fileobject, filename, filedescription, filetype, file_source]
        // }
        // files = {
        //      filehash : [fileobject, filename, filedescription, filetype, file_source]
        // }
        this.id = poiid;
        if (basicdets == null){
            this.basic = new basicEntities(
                new Map([['value', 'UNKNOWN'], ['fileobj', null]]),
                new Map([['value', 'UNKNOWN'], ['fileobj', null]]),
                new Map([['value', 'UNKNOWN'], ['fileobj', null]]),
                new Map([['value', 'UNKNOWN'], ['fileobj', null]]),
                new Map([['value', 'UNKNOWN'], ['fileobj', null]]),
                new Map([['value', 'UNKNOWN'], ['fileobj', null]]),
                new Map([['value', 'UNKNOWN'], ['fileobj', null]]),
                new Map([['value', 'UNKNOWN'], ['fileobj', null]]),
                new Map([['value', 'UNKNOWN'], ['fileobj', null]]),
            );
        } else{
            this.basic = basicdets;
        }

        this.ents = new Map();
        
        this.events = new Map();

        this.report = reporttext;
        this.images = imagefiles;
        this.images_json_serialized = new Map();

        if (this.images == null){
            this.images = new Map();
        }

        this.files = files;
        if (this.files == null){
            this.files = new Map();
        }

        this.gen_graph = null;  // graph objected generated by parser

        this.private_key = key;

        return new Proxy(this, {
            set: (target, prop, value) => {
                console.log(`Property ${prop} changed from ${target[prop]} to ${value}`);
                target[prop] = value;
                // Log the current state of the object
                console.dir(target);
                return true;
            },
            // get: (target, prop) => {
            //     console.log(`Property ${prop} accessed: ${target[prop]}`);
            //     return target[prop];
            // }
        });
    }

    add_EVENT_(eventOBJ){
        if(eventOBJ instanceof EventClass && eventOBJ.id != null){
            this.events.set(eventOBJ.id, eventOBJ);
        }
    }

    remove_EVENT_(eventID){
        if (this.events.has(eventID)){
            this.events.delete(eventID);
        }
    }

    add_ENTITY_(entOBJ){
        if(entOBJ instanceof Entity && entOBJ.id != null){
            this.ents.set(entOBJ.id, entOBJ);
        }
    }

    remove_ENTITY_(entID){
        if (this.ents.has(entID)){
            this.ents.delete(entID);
        }
    }
}

export class basicEntities{
    constructor(name, gender, dob, nationality, idnum, location, occupation, education, languages){
        this.name = name;
        this.gender = gender;
        this.dob = dob;
        this.nationality = nationality;
        this.idnum = idnum;
        this.location = location;
        this.occupation = occupation;
        this.education = education;
        this.languages = languages;
    }
}

export class Entity{
    constructor(entityname=null, entityid=null, entityfiles=null, entityval=null){
        this.name = entityname;
        this.id = entityid;
        this.files = entityfiles;
        this.val = entityval;

        if (this.files == null){
            this.files = new Map();
        }
    }

    remove_entity_file(fileid){
        if (this.files.has(fileid)){
            this.files.delete(fileid);
        }
    }
}

export class EventClass{
    constructor(eventid=null, eventname=null, eventdatetime=null, eventplace=null, eventdescription=null, eventfiles=null){
        this.id = eventid;
        if (eventname == null){
            this.name = "";
        } else {
            this.name = eventname;
        }
        this.time = eventdatetime;
        this.place = eventplace;
        this.desc = eventdescription;
        if (eventfiles == null){
            this.files = new Map();
        } else{
            if (eventfiles instanceof Map){
                this.files = eventfiles;
            }
        }
    }

    remove_event_file(fileid){
        if (this.files.has(fileid)){
            this.files.delete(fileid);
        }
    }
}

export class ImageClass{
    constructor(){   
    }

    async setImage(imageobject){
        // this.image = imageobject;
        this.img_json_serializable = await getBase64(imageobject);
    }
}

export class FileClass{
    constructor(filehash=null, filetype=null, filename=null, fileobj=null, filedescription=null, filesource=null){
        this.hash = filehash;
        this.type = filetype;
        this.fname = filename;
        this.file = fileobj;
        this.desc = filedescription;
        this.src = filesource;
        this.fileact = null;
    }

    async set_file(fileObject){
        if (fileObject instanceof File){
            this.fname = fileObject.name;
            this.type = fileObject.type;
            this.file_b64 = await getBase64(fileObject);
            this.file = await fileObject.arrayBuffer();
            try {
                this.hash = await calculate_sha256(this.file);
            } catch (error) {
                console.log(error);
            }
            this.fileact = fileObject;
            console.log(this);
            return true;
        } else{
            return false;
        }
    }

    set_desc(descr){
        if(descr instanceof String){
            this.desc = descr;
        }
    }

}

async function getBase64(fileobj) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        // Define the onload event handler
        reader.onload = () => {
            // Get the Base64 encoded string
            const base64String = reader.result.split(',')[1]; // Remove the metadata
            resolve(base64String); // Resolve the promise with the Base64 string
        };

        // Define the onerror event handler
        reader.onerror = () => {
            reject(new Error('Error reading file')); // Reject the promise on error
        };

        // Read the file as a Data URL
        reader.readAsDataURL(fileobj);
    });
}

async function calculate_sha256(fileBuffer){
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}