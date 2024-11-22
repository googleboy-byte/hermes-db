export async function POI_2_py(POI_){
    const serializedData = await POI_.toJSON();
    console.log(JSON.stringify(serializedData));
    var sendpoitopy = eel.receive_poi(JSON.stringify(serializedData))();    
}