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

function setTriggers(){
    document.getElementById('import_basicdets_btn').addEventListener('change', async function(event) {
        const file = event.target.files[0];
        if (file) {
            await importBasicDets(file);
            
            // document.getElementById('report_tarea').textContent = JSON.stringify(new_POI_obj, null, 2);
        }
    });

    // basic file attachment triggers

    document.getElementById('idPicfileInput').addEventListener('change', async function(event){
        const file = event.target.files[0];
        if (file){
            var input_file_this = new FileClass();
            var setfile = await input_file_this.set_file(file);
            if (setfile){
                new_POI_obj.basic.name.set('fileobj', input_file_this);
                // console.log(new_POI_obj.basic);
                sync_frontend_newPOI();
            }
        }
    });


}

function sync_frontend_newPOI(POI_=null){
    if (POI_ == null){
        POI_ = new_POI_obj;
    }
    if(POI_ instanceof POI){

        // sync basic values

        document.getElementById('nameInput').value = POI_.basic.name.get('value');
        document.getElementById('genderInput').value = POI_.basic.gender.get('value');
        document.getElementById('dobInput').value = POI_.basic.dob.get('value');
        document.getElementById('NATInput').value = POI_.basic.nationality.get('value');
        document.getElementById('GOVTIDInput').value = POI_.basic.idnum.get('value');
        document.getElementById('LOCInput').value = POI_.basic.location.get('value');
        document.getElementById('OCCUPInput').value = POI_.basic.occupation.get('value');
        document.getElementById('EDUInput').value = POI_.basic.education.get('value');
        document.getElementById('LANGInput').value = POI_.basic.languages.get('value');

        if (POI_.basic.name.get('fileobj') instanceof FileClass){
            document.getElementById('idpic_poi_filename').textContent = POI_.basic.name.get('fileobj').fname;
        } else {
            document.getElementById('idpic_poi_filename').textContent = "null";
        }
        if (POI_.basic.dob.get('fileobj') instanceof FileClass){
            document.getElementById('dobpicfile_poi_filename').textContent = POI_.basic.dob.get('fileobj').fname;
        } else {
            document.getElementById('dobpicfile_poi_filename').textContent = "null";
        }
        if (POI_.basic.nationality.get('fileobj') instanceof FileClass){
            document.getElementById('natpic_poi_filename').textContent = POI_.basic.nationality.get('fileobj').fname;
        } else {
            document.getElementById('natpic_poi_filename').textContent = "null";
        }
        if (POI_.basic.idnum.get('fileobj') instanceof FileClass){
            document.getElementById('govtid_poi_filename').textContent = POI_.basic.idnum.get('fileobj').fname;
        } else {
            document.getElementById('govtid_poi_filename').textContent = "null";
        }
        if (POI_.basic.location.get('fileobj') instanceof FileClass){
            document.getElementById('locpic_poi_filename').textContent = POI_.basic.location.get('fileobj').fname;
        } else {
            document.getElementById('locpic_poi_filename').textContent = "null";
        }
        if (POI_.basic.occupation.get('fileobj') instanceof FileClass){
            document.getElementById('occuppic_poi_filename').textContent = POI_.basic.occupation.get('fileobj').fname;
        } else {
            document.getElementById('occuppic_poi_filename').textContent = "null";
        }
        if (POI_.basic.education.get('fileobj') instanceof FileClass){
            document.getElementById('edupic_poi_filename').textContent = POI_.basic.education.get('fileobj').fname;
        } else {
            document.getElementById('edupic_poi_filename').textContent = "null";
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