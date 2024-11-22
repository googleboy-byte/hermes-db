import json
import pprint

def deserialize_poi(json_data):
    poi_data = json.loads(json_data)
    
    # Basic Entities
    basic = poi_data.get("basic", {})
    
    # Files
    files = {
        key: value
        for key, value in (poi_data.get("files") or [])
    }
    
    # Images
    images = {
        key: value
        for key, value in (poi_data.get("images") or {}).items()
    }
    
    # Other attributes
    poi = {
        "id": poi_data.get("id"),
        "basic": basic,
        "report": poi_data.get("report"),
        "images": images,
        "files": files,
        "events": poi_data.get("events", []),
        "entities": poi_data.get("ents", [])
    }

    # poi_nofiles = {
    #     "id": poi_data.get("id"),
    #     "basic": basic,
    #     "report": poi_data.get("report"),
    #     "events": poi_data.get("events", []),
    #     "entities": poi_data.get("ents", [])
    # }

    pprint.pprint(summarize_dict_types(poi))

    return poi

def summarize_dict_types(data, depth=0, indent="  "):
    """
    Summarizes a dictionary or nested structure by providing the types of values.

    Args:
        data (dict): The dictionary to summarize.
        depth (int): Current depth of the recursion (used internally).
        indent (str): Indentation for nested structures.

    Returns:
        str: A formatted summary of the dictionary or structure types.
    """
    if not isinstance(data, dict):
        return f"Provided input is of type {type(data).__name__}, not a dictionary."
    
    summary = []
    current_indent = indent * depth
    summary.append(f"{current_indent}Dictionary with {len(data)} keys:")

    for key, value in data.items():
        key_type = type(key).__name__
        value_type = type(value).__name__

        if isinstance(value, dict):
            summary.append(f"{current_indent}{indent}{repr(key)} ({key_type}): Nested dictionary")
            summary.append(summarize_dict_types(value, depth + 1, indent))
        elif isinstance(value, list):
            if len(value) > 0:
                list_item_types = {type(item).__name__ for item in value}
                summary.append(
                    f"{current_indent}{indent}{repr(key)} ({key_type}): List containing {', '.join(list_item_types)}"
                )
            else:
                summary.append(f"{current_indent}{indent}{repr(key)} ({key_type}): Empty list")
        else:
            summary.append(f"{current_indent}{indent}{repr(key)} ({key_type}): {value_type}")

    return "\n".join(summary)

