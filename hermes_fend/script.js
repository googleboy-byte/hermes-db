import { POI, EventClass, FileClass, basicEntities } from './poi_class.js';
import * as misc_methods from './misc_functions.js';

var new_POI_obj = null;

async function newPOI(){
    
    await load_newPoi_template();
    load_newpoi_subpage('basicents_option_btn');
    
    var new_poiid = await new_poiID();
    new_POI_obj = new POI(new_poiid);
    console.log(new_POI_obj);
    document.getElementById('import_basicdets_btn').addEventListener('change', async function(event) {
        const file = event.target.files[0];
        if (file) {
            await importBasicDets(file);
            sync_frontend_newPOI(new_POI_obj);
        }
    });

    // alert(new_POI_obj.id);
}


function sync_frontend_newPOI(POI_){

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