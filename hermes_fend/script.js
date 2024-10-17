import { POI, EventClass, FileClass, basicEntities } from './poi_class.js';
import * as misc_methods from './misc_functions.js';

var new_POI_obj = null;

async function newPOI(){
    
    await load_newPoi_template();
    load_newpoi_subpage('basicents_option_btn');
    
    var new_poiid = await new_poiID();
    new_POI_obj = new POI(new_poiid);
    
    // console.log(new_POI_obj);
    
    setTriggers();


    // alert(new_POI_obj.id);
}

async function fend_update_EVENT_(POI_event_){

    try{
        if (POI_event_ instanceof EventClass && POI_event_.id != null){
            // new event frontend
    
            const event_parentcont = document.getElementById('newpoi_entry_eventdets_parent');
            const new_event_temp_ = await fetch('new_event_fend.html');
            if (!new_event_temp_.ok){
                throw new Error('Failed to fetch new event template!!!');
            }
            var event_divtext_ = await new_event_temp_.text();
            var temp_eventholder_ = document.createElement('div');
            temp_eventholder_.innerHTML = event_divtext_;
    
            while(temp_eventholder_.firstChild){
                temp_eventholder_.firstChild.id = POI_event_.id + '_eventcont_';
                var renew_id_map_ = new Map([
                    ["#demo_eventname", POI_event_.id + "_eventname"],
                    ["#demo_eventplace", POI_event_.id + "_eventplace"],
                    ["#demo_eventdate", POI_event_.id + "_eventdate"],
                    ["#demo_event_descriptionbox", POI_event_.id + "_event_descriptionbox"],
                    ["#demo_eventfiles_input", POI_event_.id + "_eventfiles_input"]
                ]);
                for (const [demo_id_, act_id_] of renew_id_map_){
                    temp_eventholder_.firstChild.querySelector(demo_id_).id = act_id_;
                }
                event_parentcont.appendChild(temp_eventholder_.firstChild);
            }
            // event_parentcont.appendChild(temp_eventholder_.firstChild);
        }
    } catch (error){
        console.log("error in fend_update_EVENT_ :", error);
    }
    return
}

async function attach_event_triggers(POI_, event_) {
    // attach/renew event to new_POI
    if (event_ instanceof EventClass && POI_ instanceof POI && event_.id != null){
        POI_.add_EVENT_(event_);

        var field_2_mem_map_ = new Map([
            [POI_.events.get(event_.id).name, event_.id + "_eventname"],
            [POI_.events.get(event_.id).place, event_.id + "_eventplace"],
            [POI_.events.get(event_.id).datetime, event_.id + "_eventdate"],
            [POI_.events.get(event_.id).desc, event_.id + "_event_descriptionbox"],
            [POI_.events.get(event_.id).files, event_.id + "_eventfiles_input"]
        ]);

        // keeping separate function to handle files, generalize triggers for other event properties

        for (var [mem, field] of field_2_mem_map_){
            if(!field.includes("_eventfiles_input")){
                document.addEventListener('input', function(event){
                    var newval = event.target.value;
                    mem = newval;
                    console.log(mem);
                });
            } else{
                // handle file input to event
            }
        }

        
    }    
}

async function addEventClicked(eventid=null){
    try{
        if (new_POI_obj){
            
            // finish processing event. (remember to generate default file map in event class when created) (done)

            var new_POI_id_ = new_POI_obj.id;
            var new_event_id = await eel.new_event_ID(new_POI_id_)();
            var this_event = new EventClass();
            this_event.id = new_event_id;            

            // set up frontend for new event (done) (not added remove event button yet)
            var fend_event_update = await fend_update_EVENT_(this_event);

            // add event to new poi obj (done)
            // set triggers for new event edit (eventdets and eventfiles)
            attach_event_triggers(new_POI_obj, this_event);

            // add option to delete event when button clicked.
            // add events to function syncing fend with new poi obj
            
        }
    } catch(error){
        console.log("Error creating new event from template: ", error);
    }
    
}

function setTriggers(){

    // import basic button trigger

    document.getElementById('import_basicdets_btn').addEventListener('change', async function(event) {
        const file = event.target.files[0];
        if (file) {
            await importBasicDets(file);
            
            // document.getElementById('report_tarea').textContent = JSON.stringify(new_POI_obj, null, 2);
        }
    });

    document.getElementById("new_poi_new_event_btn").addEventListener('click', function(){
        addEventClicked();
    });

    // basic file attachment triggers

    var basic_fileInput_POI_ = new Map([
                                    ['idPicfileInput', new_POI_obj.basic.name],
                                    ['dobPicfileInput', new_POI_obj.basic.dob],
                                    ['natPicfileInput', new_POI_obj.basic.nationality],
                                    ['govtidPicfileInput', new_POI_obj.basic.idnum],
                                    ['locPicfileInput', new_POI_obj.basic.location],
                                    ['occupPicfileInput', new_POI_obj.basic.occupation],
                                    ['eduPicfileInput', new_POI_obj.basic.education]
                                ]);

    for (const [fieldid, file_obj_pointer] of basic_fileInput_POI_){
        document.getElementById(fieldid).addEventListener('change', async function(event){
            const file = event.target.files[0];
            if (file){
                var input_file_this = new FileClass();
                var setfile = await input_file_this.set_file(file);
                if (setfile){
                    file_obj_pointer.set('fileobj', input_file_this);
                    // console.log(new_POI_obj.basic);
                    sync_frontend_newPOI();
                }
            }
        });
    }

    // basic text input triggers

    var basic_textInput_POI_ = new Map([
        ['nameInput', new_POI_obj.basic.name],
        ['genderInput', new_POI_obj.basic.gender],
        ['dobInput', new_POI_obj.basic.dob],
        ['NATInput', new_POI_obj.basic.nationality],
        ['GOVTIDInput', new_POI_obj.basic.idnum],
        ['LOCInput', new_POI_obj.basic.location],
        ['OCCUPInput', new_POI_obj.basic.occupation],
        ['EDUInput', new_POI_obj.basic.education],
        ['LANGInput', new_POI_obj.basic.languages] 
    ]);

    for (const [tfield_id, pointer] of basic_textInput_POI_){
        document.getElementById(tfield_id).addEventListener('input', function(event){
            pointer.set('value', event.target.value);
            // console.log(tfield_id, pointer.get('value'));
        });
    }

    // report field trigger;

    document.getElementById('report_tarea').addEventListener('input', function(event){
        var field_val = event.target.value;
        new_POI_obj.report = field_val;
        console.log(new_POI_obj.report);
    });

}

function sync_frontend_newPOI(POI_=null){
    if (POI_ == null){
        POI_ = new_POI_obj;
    }
    if(POI_ instanceof POI){

        // sync basic values

        var text_update_POI_ = new Map([
            ['nameInput', POI_.basic.name],
            ['genderInput', POI_.basic.gender],
            ['dobInput', POI_.basic.dob],
            ['NATInput', POI_.basic.nationality],
            ['GOVTIDInput', POI_.basic.idnum],
            ['LOCInput', POI_.basic.location],
            ['OCCUPInput', POI_.basic.occupation],
            ['EDUInput', POI_.basic.education],
            ['LANGInput', POI_.basic.languages] 
        ]);

        for (const [field, pointer_POI_] of text_update_POI_){
            document.getElementById(field).value = pointer_POI_.get('value');
        }

        // sync basic file objects

        var fileupdate_POI_ = new Map([
            ['idpic_poi_filename', POI_.basic.name],
            ['dobpicfile_poi_filename', POI_.basic.dob],
            ['natpic_poi_filename', POI_.basic.nationality],
            ['govtid_poi_filename', POI_.basic.idnum],
            ['locpic_poi_filename', POI_.basic.location],
            ['occuppic_poi_filename', POI_.basic.occupation],
            ['edupic_poi_filename', POI_.basic.education],
        ]);

        var filetag_map_fileinput = new Map([
            ['idpic_poi_filename', 'idPicfileInput'],
            ['dobpicfile_poi_filename', 'dobPicfileInput'],
            ['natpic_poi_filename', 'natPicfileInput'],
            ['govtid_poi_filename', 'govtidPicfileInput'],
            ['locpic_poi_filename', 'locPicfileInput'],
            ['occuppic_poi_filename', 'occupPicfileInput'],
            ['edupic_poi_filename', 'eduPicfileInput'],
        ]);

        for (const [filefield, fileobj] of fileupdate_POI_){
            if (fileobj.get('fileobj') instanceof FileClass){
                document.getElementById(filefield).textContent = fileobj.get('fileobj').fname;
                document.getElementById(filefield).onclick = function(){
                    fileobj.set('fileobj', null);
                    sync_frontend_newPOI();
                    document.getElementById(filetag_map_fileinput.get(filefield)).value = "";
                }
            } else {
                document.getElementById(filefield).textContent = "null";
            }
        }
        
        // sync report 

        document.getElementById('report_tarea').textContent = POI_.report;

        
    }
}

async function importBasicDets(filehandle){
    const reader = new FileReader();
    reader.onload = async function(event){
        const content = event.target.result;
        var parsed_basicdets_values = await eel.parse_basicdets(content)();
        // console.log(parsed_basicdets_values);
        var bdets_keys = parsed_basicdets_values[0];
        var bdets_values = parsed_basicdets_values[1];

        if (bdets_keys != null && bdets_values != null){
            var finvallist = [];
            for (let index = 0; index < bdets_values.length; index++) {
                // var this_file_attached = new FileClass();
                var this_file_attached = null;
                const bdetvalue = bdets_values[index];
                var keylist = ['value', 'fileobj'];
                var valuelist = [bdetvalue, this_file_attached];
                var finval = misc_methods.list_to_map(keylist, valuelist);
                finvallist.push(finval);
            }
            var bdetsmap = misc_methods.list_to_map(bdets_keys, finvallist);
            
            new_POI_obj.basic.name.set('value', bdetsmap.get('Name').get('value'));
            new_POI_obj.basic.dob.set('value', bdetsmap.get('DOB').get('value'));
            new_POI_obj.basic.gender.set('value', bdetsmap.get('Gender').get('value'));
            new_POI_obj.basic.nationality.set('value', bdetsmap.get('Nationality').get('value'));
            new_POI_obj.basic.idnum.set('value', bdetsmap.get('ID Number').get('value'));
            new_POI_obj.basic.location.set('value', bdetsmap.get('Location').get('value'));
            new_POI_obj.basic.occupation.set('value', bdetsmap.get('Occupation').get('value'));
            new_POI_obj.basic.education.set('value', bdetsmap.get('Education').get('value'));
            new_POI_obj.basic.languages.set('value', bdetsmap.get('Languages').get('value'));
            

            sync_frontend_newPOI(new_POI_obj);
            // const bdets_map_jsonified = misc_methods.mapToObject(bdetsmap);
            // console.log(JSON.stringify(bdets_map_jsonified, null, 2));
            // console.log(new_POI_obj);
        }

    };

    reader.readAsText(filehandle);

    reader.onerror = function(event){
        console.error("Error importing file: ", event.target.error);
        return null;
    };

    
}

async function new_poiID(){
    var newid = await eel.newPOIID()();
    return newid;
}

document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('newpoi_btn').addEventListener('click', newPOI);
});

async function load_newPoi_template(){
    const new_poi_parent_cont = document.getElementById('maincont');
    new_poi_parent_cont.innerHTML = '';
    const new_poi_template = await fetch('newPoi_temp.html');
    const new_poi_tempcontent = await new_poi_template.text()
    new_poi_parent_cont.innerHTML = new_poi_tempcontent;
}