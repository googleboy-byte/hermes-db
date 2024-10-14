export class POI{
    constructor(poiid, basicdets=null, eventdets=null, reporttext=null, imagefiles=null, files=null){
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
        this.events = eventdets;
        this.report = reporttext;
        this.images = imagefiles;
        this.files = files;
        this.gen_graph = null;  // graph objected generated by parser
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

export class EventClass{
    constructor(eventid, eventname, eventdatetime, eventplace, eventdescription, eventfiles){
        this.id = eventid;
        this.name = eventname;
        this.time = eventdatetime;
        this.place = eventplace;
        this.desc = eventdescription;
        this.files = eventfiles;
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
    }

    async set_file(fileObject){
        if (fileObject instanceof File){
            this.fname = fileObject.name;
            this.type = fileObject.type;
            this.file = await fileObject.arrayBuffer();
            this.hash = await calculate_sha256(this.file);
            return true;
        } else{
            return false;
        }
    }
}

async function calculate_sha256(fileBuffer){
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}