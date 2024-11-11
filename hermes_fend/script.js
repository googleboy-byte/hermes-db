import { POI, EventClass, FileClass, basicEntities, Entity, ImageClass } from './poi_class.js';
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

async function fend_update_ENTITY_(POI_entity_){

    try{
        if (POI_entity_ instanceof Entity && POI_entity_.id != null){
            // new event frontend
	    // test emacs comment
    
            const entity_parentcont = document.getElementById('newpoi_entry_custents_parent');
            const new_entity_temp_ = await fetch('new_entity_fend.html');
            if (!new_entity_temp_.ok){
                throw new Error('Failed to fetch new entity template!!!');
            }
            var entity_divtext_ = await new_entity_temp_.text();
            var temp_entholder_ = document.createElement('div');
            temp_entholder_.innerHTML = entity_divtext_;
    
            while(temp_entholder_.firstChild){
                temp_entholder_.firstChild.id = POI_entity_.id + '_entcont_';
                var renew_id_map_ = new Map([
                    ["#demo_customent_label", POI_entity_.id + "_entname"],
                    ["#demo_customent_input", POI_entity_.id + "_entval"],
                    ["#demo_custent_fileinp_label", POI_entity_.id + "_entfileinplabel"],
                    ["#demo_custent_fileinput", POI_entity_.id + "_entfileinput"],
                    ["#demo_custent_id", POI_entity_.id + "_entid"]
                ]);
                for (const [demo_id_, act_id_] of renew_id_map_){
                    if (temp_entholder_.firstChild) {
                        const childElement = temp_entholder_.firstChild;
                        const foundElement = childElement.querySelector(demo_id_);
                        if (foundElement) {
                            foundElement.id = act_id_;
                        } else {
                            console.error("Element with demo_id_ not found within first child." + demo_id_);
                        }
                    } else {
                        alert("First child not found!!!");
                    }
                }
                temp_entholder_.firstChild.querySelector("#detach_ENT_btn_this").onclick = function(){
                    // console.log("remove event called: " + POI_event_.id);
                    new_POI_obj.remove_ENTITY_(POI_entity_.id);
                    // console.log(new_POI_obj);    // event is being removed from dat struct. must be problem with frontend
                    sync_frontend_newPOI();     // maybe update this function to include event ops
                };
                entity_parentcont.appendChild(temp_entholder_.firstChild);
            }
            // event_parentcont.appendChild(temp_eventholder_.firstChild);
        }
    } catch (error){
        console.log("error in fend_update_ENTITY_ :", error);
    }
    return
}

async function fend_update_EVENT_(POI_event_){

    try{
        if (POI_event_ instanceof EventClass && POI_event_.id != null){
            // new event frontend
	    // test emacs comment
    
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
                    if (temp_eventholder_.firstChild) {
                        const childElement = temp_eventholder_.firstChild;
                        const foundElement = childElement.querySelector(demo_id_);
                        if (foundElement) {
                            foundElement.id = act_id_;
                        } else {
                            console.error("Element with demo_id_ not found within first child.");
                        }
                    } else {
                        alert("First child not found!!!");
                    }
                }
                temp_eventholder_.firstChild.querySelector("#detach_event_btn_this").onclick = function(){
                    // console.log("remove event called: " + POI_event_.id);
                    new_POI_obj.remove_EVENT_(POI_event_.id);
                    // console.log(new_POI_obj);    // event is being removed from dat struct. must be problem with frontend
                    sync_frontend_newPOI();     // maybe update this function to include event ops
                };
                event_parentcont.appendChild(temp_eventholder_.firstChild);
            }
            // event_parentcont.appendChild(temp_eventholder_.firstChild);
        }
    } catch (error){
        console.log("error in fend_update_EVENT_ :", error);
    }
    return
}

async function attach_entity_triggers(POI_, ent_) {
    // attach/renew event to new_POI
    if (ent_ instanceof Entity && POI_ instanceof POI && ent_.id != null){
        POI_.add_ENTITY_(ent_);

        // var field_2_mem_map_ = new Map([
        //     ["name", ent_.id + "_entname"],
        //     ["id", ent_.id + "_entid"],
        //     ["files", ent_.id + "_entfileinput"],
        //     ["val", ent_.id + "_entval"],
        // ]);

        // keeping separate function to handle files, generalize triggers for other event properties
        var this_ent = await new_POI_obj.ents.get(ent_.id);

        document.getElementById(ent_.id + "_entname").addEventListener('input', async function(event){
            this_ent.name = event.target.value;
            console.log(this_ent);
        });
        document.getElementById(ent_.id + "_entval").addEventListener('input', async function(event){
            this_ent.val = event.target.value;
            console.log(this_ent);
        });
        
        document.getElementById(ent_.id + "_entfileinput").addEventListener('change', async function(event){
            const ent_file_this_ = event.target.files[0];
            if(ent_file_this_){
                add_ent_file(ent_, new_POI_obj, ent_file_this_);
            }
            console.log(this_ent);
        });
        
    }    
}

async function attach_event_triggers(POI_, event_) {
    // attach/renew event to new_POI
    if (event_ instanceof EventClass && POI_ instanceof POI && event_.id != null){
        POI_.add_EVENT_(event_);

        var field_2_mem_map_ = new Map([
            ["name", event_.id + "_eventname"],
            ["place", event_.id + "_eventplace"],
            ["datetime", event_.id + "_eventdate"],
            ["desc", event_.id + "_event_descriptionbox"],
            ["files", event_.id + "_eventfiles_input"]
        ]);

        // keeping separate function to handle files, generalize triggers for other event properties
        var this_event = await new_POI_obj.events.get(event_.id);

        document.getElementById(event_.id + "_eventname").addEventListener('input', async function(event){
            this_event.name = event.target.value;
            console.log(this_event);
        });
        document.getElementById(event_.id + "_eventplace").addEventListener('input', async function(event){
            this_event.place = event.target.value;
            console.log(this_event);
        });
        document.getElementById(event_.id + "_eventdate").addEventListener('input', async function(event){
            this_event.time = event.target.value;
            console.log(this_event);
        });
        document.getElementById(event_.id + "_event_descriptionbox").addEventListener('input', async function(event){
            this_event.desc = event.target.value;
            console.log(this_event);
        });
        document.getElementById(event_.id + "_eventfiles_input").addEventListener('change', async function(event){
            const event_file_this_ = event.target.files[0];
            if(event_file_this_){
                add_event_file(event_, new_POI_obj, event_file_this_);
            }
            console.log(this_event);
        });

        // for (var [mem, field] of field_2_mem_map_){
        //     if(field != event_.id + "_eventfiles_input"){
        //         document.getElementById(field).addEventListener('input', async function(event){
                    
        //             this_event[mem] = event.target.value;
        //             console.log(mem);
        //             console.log(this_event);
        //         });
        //     } else{
        //         // handle file input to event (do next oct 17 14:14)
        //         document.getElementById(field).addEventListener('change', async function(event){
        //             const event_file_this_ = event.target.files[0];
        //             if(event_file_this_){
        //                 add_event_file(event_, POI_, event_file_this_);
        //             }
        //         });
        //     }
        // } 
        
        
    }    
}


function add_ent_file_fend_(ent_id, file_){
    if (new_POI_obj.ents.has(ent_id)){
        var ent_fend = document.getElementById(ent_id + "_entcont_");
        var entfileholder_element_ = ent_fend.querySelector('#this_file_holder_');
        if(entfileholder_element_){
            // console.log("holder found");
            var fend_ent_file = document.createElement('div');
            fend_ent_file.id = file_.fname + "_ent_file_element";
            fend_ent_file.style.display = 'flex';
            fend_ent_file.style.flexDirection = 'row';
            fend_ent_file.style.justifyContent = 'space-around';
            fend_ent_file.style.width = '98%';
            fend_ent_file.style.border = '1px solid rgb(1, 1, 131)';
            fend_ent_file.style.marginTop = '4px';
            fend_ent_file.style.padding = '5px 5px';
            fend_ent_file.textContent = file_.fname;
            // fend_event_file.onclick = function(){
            //     new_POI_obj.events.get(event_id).remove_event_file(file_.fname);
            //     fend_event_file.remove();
            // };
            var fend_ent_file_desc = document.createElement('input');
            fend_ent_file_desc.type = 'text';
            fend_ent_file_desc.className = 'stylish-input';
            fend_ent_file_desc.id = ent_id + "_entfiledesc_" + file_.fname;
            fend_ent_file_desc.style.width = "40%";
            fend_ent_file_desc.style.marginRight = "10px";
            fend_ent_file_desc.addEventListener('input', function(event){
                var ent_file_desc = event.target.value;
                // alert(ent_file_desc);
                // if (event_file_desc instanceof String)
                new_POI_obj.ents.get(ent_id).files.get(file_.fname).desc = ent_file_desc;
                console.log(file_);
                console.log(new_POI_obj.ents.get(ent_id));
            });
            if (file_.desc != null){
                fend_ent_file_desc.value = file_.desc;
            }
            fend_ent_file.appendChild(fend_ent_file_desc);
            var detach_file_elem = document.createElement('div');
            detach_file_elem.className = 'styled-btn-addevent-close';
            detach_file_elem.textContent = "DETACH FILE";
            detach_file_elem.onclick = function(){
                new_POI_obj.ents.get(ent_id).remove_entity_file(file_.fname);
                fend_ent_file.remove();
            };
            fend_ent_file.appendChild(detach_file_elem);

            entfileholder_element_.appendChild(fend_ent_file);
        } else{
            console.log("holder not found");
        }
    
    }    
}


function add_event_file_fend_(event_id, file_){
    if (new_POI_obj.events.has(event_id)){
        var event_fend = document.getElementById(event_id + "_eventcont_");
        var eventfileholder_element_ = event_fend.querySelector('#this_file_holder_');
        if(eventfileholder_element_){
            // console.log("holder found");
            var fend_event_file = document.createElement('div');
            fend_event_file.id = file_.fname + "_event_file_element";
            fend_event_file.style.display = 'flex';
            fend_event_file.style.flexDirection = 'row';
            fend_event_file.style.justifyContent = 'space-around';
            fend_event_file.style.width = '98%';
            fend_event_file.style.border = '1px solid rgb(1, 1, 131)';
            fend_event_file.style.marginTop = '4px';
            fend_event_file.style.padding = '5px 5px';
            fend_event_file.textContent = file_.fname;
            // fend_event_file.onclick = function(){
            //     new_POI_obj.events.get(event_id).remove_event_file(file_.fname);
            //     fend_event_file.remove();
            // };
            var fend_event_file_desc = document.createElement('input');
            fend_event_file_desc.type = 'text';
            fend_event_file_desc.className = 'stylish-input';
            fend_event_file_desc.id = event_id + "_eventfiledesc_" + file_.fname;
            fend_event_file_desc.style.width = "40%";
            fend_event_file_desc.style.marginRight = "10px";
            fend_event_file_desc.addEventListener('input', function(event){
                var event_file_desc = event.target.value;
                // alert(event_file_desc);
                // if (event_file_desc instanceof String)
                new_POI_obj.events.get(event_id).files.get(file_.fname).desc = event_file_desc;
                console.log(file_);
                console.log(new_POI_obj.events.get(event_id));
            });
            if (file_.desc != null){
                fend_event_file_desc.value = file_.desc;
            }
            fend_event_file.appendChild(fend_event_file_desc);
            var detach_file_elem = document.createElement('div');
            detach_file_elem.className = 'styled-btn-addevent-close';
            detach_file_elem.textContent = "DETACH FILE";
            detach_file_elem.onclick = function(){
                new_POI_obj.events.get(event_id).remove_event_file(file_.fname);
                fend_event_file.remove();
            };
            fend_event_file.appendChild(detach_file_elem);

            eventfileholder_element_.appendChild(fend_event_file);
        } else{
            console.log("holder not found");
        }
    
    }    
}

function add_ent_file(entObj_, POI_Obj_, file_obj_){
    var this_ent_file_ = new FileClass();
    var saved_this_ent_file_ = this_ent_file_.set_file(file_obj_);
    if (saved_this_ent_file_){
        console.log("file set");
        POI_Obj_.ents.get(entObj_.id).files.set(this_ent_file_.fname, this_ent_file_);
        add_ent_file_fend_(entObj_.id, this_ent_file_);
    }

}

function add_event_file(eventObj_, POI_Obj_, file_obj_){
    var this_event_file_ = new FileClass();
    var saved_this_event_file_ = this_event_file_.set_file(file_obj_);
    if (saved_this_event_file_){
        console.log("file set");
        POI_Obj_.events.get(eventObj_.id).files.set(this_event_file_.fname, this_event_file_);
        add_event_file_fend_(eventObj_.id, this_event_file_);
    }

}

async function addEntClicked(){
    try{
        if (new_POI_obj){
            
            // finish processing entity. (remember to generate default file map in event class when created) (done)

            var new_POI_id_ = new_POI_obj.id;
            var new_entity_id = await eel.new_ent_ID(new_POI_id_)();
            var this_entity = new Entity();
            this_entity.id = new_entity_id;            

            // set up frontend for new event (done)
            var fend_entity_update = await fend_update_ENTITY_(this_entity);

            // add event to new poi obj (done)
            // set triggers for new event edit (eventdets and eventfiles) (done)
            attach_entity_triggers(new_POI_obj, this_entity); // MODIFY FOR ENTITIES

            // add option to delete event when button clicked. (done)
            // add events to function syncing fend with new poi obj (done)
            update_entity_val(this_entity, new_POI_obj);
            
        }
    } catch(error){
        console.log("Error creating new ENTITY from template: ", error);
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
            // set triggers for new event edit (eventdets and eventfiles) (done)
            attach_event_triggers(new_POI_obj, this_event);

            // add option to delete event when button clicked. (done)
            // add events to function syncing fend with new poi obj (done)
            
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
                console.log(new_POI_obj);
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

    // custom entities 

    document.getElementById("new_poi_new_entity_btn").addEventListener('click', function(){
        addEntClicked();
    });

    // upload image triggers

    var imageinput = document.querySelector("#imagefilesinput");
    imageinput.addEventListener('change', (event) => {
        const imgfiles = event.target.files;
        handleimages(imgfiles);
        event.target.value = '';
    });

    var clearimagesbtn = document.querySelector('#clearimagesbtn');
    clearimagesbtn.addEventListener('click', function(){
        clear_newPOI_images();
    });

    // upload files triggers

    var fileinput = document.querySelector("#filesinput");
    fileinput.addEventListener('change', (event) => {
        const inputfiles = event.target.files;
        handlefiles(inputfiles);
        event.target.value = '';
    });

    var clearfilesbtn = document.querySelector("#clearfilesbtn");
    clearfilesbtn.addEventListener('click', function(){
        clear_newPOI_files();
    });

}

async function clear_newPOI_files(){
    new_POI_obj.files = new Map();
    update_newPOI_files_fend();
}

async function handlefiles(inputfiles){
    const imgFiles2 = Array.from(inputfiles).filter(file => file.type.startsWith('image/'));
    handleimages(null, imgFiles2);
    const nonImageFiles = Array.from(inputfiles).filter(file => !file.type.startsWith('image/'));
    nonImageFiles.forEach(file => {
        var thisFile = new FileClass();
        thisFile.set_file(file);
        new_POI_obj.files.set(thisFile.fname, thisFile);
    });
    update_newPOI_files_fend();
}

async function update_newPOI_files_fend(){
    var files_fend_cont_ = document.querySelector('#files_cont_');
    files_fend_cont_.innerHTML = '';
    new_POI_obj.files.forEach((file, filename) => {
        var this_file_element_ = document.createElement('div');
        this_file_element_.className = 'thisfileshow_class';
        this_file_element_.textContent = filename;

        var thisfile_del_btn_ = document.createElement('button');
        thisfile_del_btn_.className = 'delete-button1';
        thisfile_del_btn_.textContent = 'X';
        thisfile_del_btn_.onclick = function(){
            new_POI_obj.files.delete(filename);
            update_newPOI_files_fend();
        };

        this_file_element_.appendChild(thisfile_del_btn_);

        files_fend_cont_.appendChild(this_file_element_);
    });
}

async function clear_newPOI_images() {
    new_POI_obj.images = new Map();
    refresh_NewPOI_Gallery();
}

async function handleimages(allfiles=null, imgFiles1=null){
    // alert("img handler called");
    var imgFiles_ = null;
    if (imgFiles1 == null){
        imgFiles_ = Array.from(allfiles).filter(file => file.type.startsWith('image/'));
    } else{
        imgFiles_ = imgFiles1;
    }
    var gallery_element_ = document.getElementById("gallery");
    gallery_element_.innerHTML = "";
    if (imgFiles_.length > 0){
        imgFiles_.forEach(imgfile => {
            var this_Img_File_ = new ImageClass();
            this_Img_File_.setImage(imgfile);
            new_POI_obj.images.set(imgfile.name, imgfile);
            new_POI_obj.images_json_serialized.set(imgfile.name, this_Img_File_);
            // var img = document.createElement('img');
            
            // const deleteButton = document.createElement('button');
            
            // deleteButton.textContent = 'X';
            // deleteButton.className = 'delete-button';
            // deleteButton.onclick = () => {
            //     new_POI_obj.images.delete(imgfile.fname);
            //     // updateGallery(); // Update the gallery display
            //     refresh_NewPOI_Gallery();
            // };
            
            // const galleryItem = document.createElement('div');
            // galleryItem.className = 'gallery-item';
            
            // const imgreader = new FileReader();
            
            // imgreader.onload = function(e){
            //     img.src = e.target.result;
            //     img.id = imgfile.fname + "_img_element_";
            //     // img.onclick = function(){
            //     //     new_POI_obj.images.delete(this_Img_File_.fname);
            //     //     // refresh_NewPOI_Gallery();
            //     // };
            //     galleryItem.appendChild(img);
            //     galleryItem.appendChild(deleteButton);
            //     gallery_element_.appendChild(galleryItem);
            // };            
            
            // imgreader.readAsDataURL(imgfile);
        
        });
    }
    refresh_NewPOI_Gallery();
}

async function refresh_NewPOI_Gallery(){
    
    var gallery_element_ = document.getElementById("gallery");
    gallery_element_.innerHTML = "";

    console.log(new_POI_obj);

    // if (new_POI_obj.images.length > 0){

    new_POI_obj.images.forEach((imgfile, imgfilename) => {
        // var this_Img_File_ = new FileClass();
        // this_Img_File_.set_file(imgfile);
        // new_POI_obj.images.set(imgfile.name, imgfile);
        
        var img = document.createElement('img');
        
        const deleteButton = document.createElement('button');
        
        deleteButton.textContent = 'X';
        deleteButton.className = 'delete-button';
        deleteButton.onclick = () => {
            new_POI_obj.images.delete(imgfile.name);
            new_POI_obj.images_json_serialized.delete(imgfile.name);
            // updateGallery(); // Update the gallery display
            refresh_NewPOI_Gallery();
        };
        
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        
        const imgreader = new FileReader();
        
        imgreader.onload = function(e){
            img.src = e.target.result;
            img.id = imgfile.name + "_img_element_";
            // img.onclick = function(){
            //     new_POI_obj.images.delete(this_Img_File_.fname);
            //     // refresh_NewPOI_Gallery();
            // };
            galleryItem.appendChild(img);
            galleryItem.appendChild(deleteButton);
            gallery_element_.appendChild(galleryItem);
        };            
        
        imgreader.readAsDataURL(imgfile);
    
    });


    // }

}

async function sync_frontend_newPOI(POI_=null){
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

        // // sync events

        var allevents = POI_.events;
        const allElements = document.querySelectorAll('*');

        // Iterate through the elements
        allElements.forEach(element => {
            // Check if the element's ID contains the specified substring
            if (element.id.includes("_eventcont_")) {
                element.remove(); // Remove the element from the document
            }
        });

        for (var [eventid, event_this_] of allevents){
            var fend_event_update = await fend_update_EVENT_(event_this_);

            // add event to new poi obj (done)
            // set triggers for new event edit (eventdets and eventfiles) (done)
            attach_event_triggers(new_POI_obj, event_this_);
            await update_event_val(event_this_, POI_);
        }

        // // sync events

        var allents = POI_.ents;
        const allEntities = document.querySelectorAll('*');

        // Iterate through the elements
        allEntities.forEach(element => {
            // Check if the element's ID contains the specified substring
            if (element.id.includes("_entcont_")) {
                element.remove(); // Remove the element from the document
            }
        });

        for (var [entid, ent_this_] of allents){
            var fend_ent_update = await fend_update_ENTITY_(ent_this_);

            // add event to new poi obj (done)
            // set triggers for new event edit (eventdets and eventfiles) (done)
            attach_entity_triggers(new_POI_obj, ent_this_);
            await update_entity_val(ent_this_, POI_);
        }

        
    }
}


async function update_entity_val(ent_, POI_){
    console.log(POI_);
    var field_2_mem_map_ = new Map([
        [POI_.ents.get(ent_.id).name, ent_.id + "_entname"],
        [POI_.ents.get(ent_.id).val, ent_.id + "_entval"],
        [POI_.ents.get(ent_.id).id, ent_.id + "_entid"],
        // [POI_.ents.get(ent_.id).desc, ent_.id + "_event_descriptionbox"],
        [POI_.ents.get(ent_.id).files, ent_.id + "_entfileinput"]
    ]);

    for (var [mem, field] of field_2_mem_map_){
        if(!field.includes("_entfileinput")){
            if (field.includes("_entid")){
                document.getElementById(field).textContent = mem;
            } else{
                document.getElementById(field).value = mem;
            }
        } else{
            for (const [fileid, file] of mem){
                add_ent_file_fend_(ent_.id, file);
            }
        }
    } 
}

async function update_event_val(event_, POI_){
    console.log(POI_);
    var field_2_mem_map_ = new Map([
        [POI_.events.get(event_.id).name, event_.id + "_eventname"],
        [POI_.events.get(event_.id).place, event_.id + "_eventplace"],
        [POI_.events.get(event_.id).time, event_.id + "_eventdate"],
        [POI_.events.get(event_.id).desc, event_.id + "_event_descriptionbox"],
        [POI_.events.get(event_.id).files, event_.id + "_eventfiles_input"]
    ]);

    for (var [mem, field] of field_2_mem_map_){
        if(!field.includes("_eventfiles_input")){
            document.getElementById(field).value = mem;
        } else{
            for (const [fileid, file] of mem){
                add_event_file_fend_(event_.id, file);
            }
        }
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
