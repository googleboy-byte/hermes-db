export function list_to_map(keylist, valuelist){
    var retmap = new Map();
    if (keylist.length !== valuelist.length){
        console.error("two arrays of keys and values for map must have same length");
        return null;
    }
    for (let index = 0; index < keylist.length; index++) {
        const keyelement = keylist[index];
        const value_element = valuelist[index];
        retmap.set(keyelement, value_element);
    }
    return retmap
}

export function mapToObject(map) {
    const obj = {};
    for (const [key, value] of map) {
        // If the value is a Map, convert it to an object recursively
        if (value instanceof Map) {
            obj[key] = mapToObject(value);
        } else {
            obj[key] = value;
        }
    }
    return obj;
}