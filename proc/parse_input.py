import sys
import nltk
from nltk import ne_chunk, pos_tag, word_tokenize
import re
from datetime import datetime
import spacy
import dateparser.search
from urllib.parse import urlparse
import pprint
from collections import deque
import networkx as nx
import matplotlib.pyplot as plt
import random
from urllib.parse import urlparse
import time


# selected_entities = []

def rand_ten_gen(existing_val_list):
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

def extract_dates_nlp(text):
    tokens = nltk.word_tokenize(text)
    dates = []

    # Join the tokens back into a text for dateparser to work on it
    date_str = ' '.join(tokens)

    # Using dateparser to detect multiple dates from natural language text
    parsed_dates = dateparser.search.search_dates(date_str, settings={'STRICT_PARSING': True})

    if parsed_dates:
        for parsed_date in parsed_dates:
            date_obj = parsed_date[1]
            dates.append(date_obj.strftime('%Y-%m-%d'))
    
    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ == "DATE":
            dates.append(ent.text)
    
    return dates

def group_like_ents(ent_graph, primary_node):
    # ent_graph = {}
    for node, adjacentlist in ent_graph.items():
        common_hash = {}
        for adj in adjacentlist:
            if "@" in adj[1]:
                if adj[1].split("@")[1] in common_hash:
                    common_hash[adj[1].split("@")[1]].append((adj[0], adj[1]))
                else:
                    common_hash[adj[1].split("@")[1]] = [(adj[0], adj[1])]
        for label, nodelist in common_hash.items():
            for node, nodetype in nodelist:
                for othernode, othernodetype in nodelist:
                    if node != othernode:
                        if node in ent_graph and (othernode, othernodetype) not in ent_graph[node]:
                            # ent_graph[node].append((othernode, othernodetype + "_group"))
                            ent_graph[node].append((othernode, othernodetype + "@_group_group"))
    
    return ent_graph

def add_edge(graph, node1, node2, edge_label):
    # if node1 not in graph:
    #     graph[node1] = set()
    try:
        graph[node1].add((node2, edge_label))
    except Exception as e:
        # print(e)
        # print("Failed to add node")
        pass # node not in graph
    return graph


def add_similarity_edges_by_context(graph, doc, entities, threshold=0.75):
    # Compare every pair of entities
    for i in range(len(entities)):
        for j in range(i + 1, len(entities)):
            ent1 = entities[i]
            ent2 = entities[j]
            
            # Get the sentences where the entities occur
            sent1 = ent1.sent
            sent2 = ent2.sent
            
            # Compute similarity between the sentences (context)
            similarity = sent1.similarity(sent2)
            
            # If similarity is above threshold, add a "similar" edge between the nodes
            if similarity > threshold:
                add_edge(graph, ent1.text, ent2.text, "SIMILAREDGE@contextMatch_" + str(threshold))
                add_edge(graph, ent2.text, ent1.text, "SIMILAREDGE@contextMatch_" + str(threshold))
    return graph

def parse_eventtxt(text):

    event_blocks = text.split('@@ event @@')[1:]  # Skip the first empty split

    events = []
    for block in event_blocks:
        try:
            # Extract event_name using regex
            name_match = re.search(r'@ event_name: ([\w\s]+) @', block)
            event_name = name_match.group(1) if name_match else None

            # Extract event_time using regex
            time_match = re.search(r'@ event_time: (\d{4}) @', block)
            event_time = time_match.group(1) if time_match else None

            # Extract event_place using regex
            place_match = re.search(r'@ event_place: ([\w\s]+) @', block)
            event_place = place_match.group(1) if place_match else None

            # Extract the event description (the rest of the block)
            event_description = re.sub(r'@[\w\s:]+@', '', block).strip()

            # Append the structured event as a dictionary
            events.append({
                'event_name': event_name,
                'event_time': event_time,
                'event_place': event_place,
                'description': event_description
            })
        except Exception as e:
            print(f"Failed to process event: \n\n {block} \n")
            print(e)
            print()
            pass

    ret_event_graph_list = {}
    for event in events:
        eventkey = gen_event_key_unique()
        event_meta = {
            "event_key" : eventkey,
            "event_name" : event["event_name"],
            "event_time" : event["event_time"],
            "event_place" : event["event_place"],
            
        }
        (a, b, c, event_desc_graph, d, event_id_map, event_id_map_reverse, event_doc, event_text, event_entity_pos_map) = extract_ne(
            text=event["description"], 
            labelledtxt="", 
            priment=(eventkey, "eventkey@"+event["event_name"]), 
            parse_nphrases=False, 
            group_likeentities=False, 
            event_defaults=event_meta
        )
        plot_graph(event_desc_graph, eventkey)

        ret_event_graph_list[eventkey] = [event_desc_graph, event_id_map, event_id_map_reverse, event_text, event_meta]

    return ret_event_graph_list

def gen_event_key_unique():
    retval = "eventkey_" + rand_ten_gen([]) # later fix (replace the list with list of existing event keys) this to check if event key already exists in database. if exists, get new key
    return retval

def extract_ne(text, labelledtxt, firstlayer=True, priment=None, eventdata={}, parse_nphrases=False, group_likeentities=True, event_defaults={}):

    # priment -> (primary_entity_name, primary_entity_label)

    # eventdata -> {eventid:(time, place, notes)} 
    # eventid will be primary entity while parsing eventdata. 
    # eventdata_notes will only be parsed with nlp. 
    # event_time_place will be under event_predefd
    
    # predefd -> [(value, name), (value, name), ....] -> [(Alex Reynolds, Name), (Freelance Journalist, Occupation), ....]

    ##### identify entities other than named entities in text #####

    predefd = []
    for line in labelledtxt.split("\n"):
        if ":" in line and len(line) > 1 and line.count(":") == 1:
            valuelist = line.split(":")[1].split(",")
            for i in range(len(valuelist)):
                valuelist[i] = valuelist[i].strip()
            valuelabel = line.split(":")[0].strip()
            for value in valuelist:
                predefd.append((value, valuelabel))
    links_xtractd = extract_links(text)
    infosocmed = soc_med_extract(text, links_xtractd)
    socmed_justvals = []
    for keys, vals in infosocmed.items():
        socmed_justvals.extend(vals)
    # print(socmed_justvals)
    non_socmed_links = []
    for link in extract_links(text):
        if link_is_socmed(link) == False:
            non_socmed_links.append(link)
    specremove_socmed_justvals = remove_special_characters("".join(socmed_justvals)).replace(" ", "")

    ##### identify entities other than named entities in text (END) #####

    proper_nouns = []
    doc = nlp(text)
    mv = None

    ##### identify and label nlp entities #####
    
    entity_pos_map = {}
    entities = {}
    lastverb = ""
    noun_chunks_as_spans_doclevel = [spacy.tokens.Span(doc, chunk.start, chunk.end, label="NOUN_PHRASE") for chunk in doc.noun_chunks]
    doc_n_phrases = [chunk.text for chunk in doc.noun_chunks]
    docents = [ent.text for ent in doc.ents]
    if parse_nphrases:
        combined = list(doc.ents) + noun_chunks_as_spans_doclevel
    else:
        combined = doc.ents
    for ent in combined:
        label = ent.label_
        for token in ent.root.head.children:
            if token.dep_ == "prep" and token.text == "in":
                mv = token.head.head.lemma_
                if lastverb != mv:
                    lastverb = mv
                    label = "event@" + mv
                else:
                    label = "event@" + lastverb
            elif token.dep_ == "nsubj" and token.head.pos_ == "VERB":
                mv = token.head.lemma_
                if lastverb != mv:
                    lastverb = mv
                    label = "role@" + mv
                else:
                    label = "role@" + lastverb
            else:
                if ent.root.dep_ in ['nsubj', 'nsubjpass', 'dobj', 'pobj']:  # Subject or object dependencies
                    if "@" not in label:
                        mv = "@" + ent.root.head.head.text
                        if lastverb != mv:
                            lastverb = mv
                            label += mv
                        else:
                            label += lastverb 
            if "@" not in label:
                label += lastverb
        if ent.label_ not in entities:
            entities[ent.label_] = [(ent.text, label)]
        else:
            entities[ent.label_].append((ent.text, label))
        if ent.text not in entity_pos_map:
            entity_pos_map[ent.text] = set()
            entity_pos_map[ent.text].add((ent.start_char, ent.end_char, ent.label_))
        else:
            entity_pos_map[ent.text].add((ent.start_char, ent.end_char, ent.label_))
    # print("#################")
    # pprint.pprint(entities)
    # print("#################")

    ##### identify and label nlp entities (END) #####

    ##### important vars including ret vars #####

    entity_dict = {}
    id_map = {}
    id_map_reverse = {}

    allents = [ent.text for ent in doc.ents]

    named_entities = []

    ne_nltk_dict = {}

    ##### important vars including ret vars (END) #####
    
    ##### add doc ents as nodes to entgraph #####
    
    for entity in allents:
        entity_dict[entity] = set()
    
    ##### add doc ents as nodes to entgraph (END) #####

    ##### identify and add primary entity to entgraph #####

    primary_entity = None
    primary_ent_id = None
    retpriment = None

    primary_entity_found = False
    if priment != None:
        if str(type(priment)) == "<class 'tuple'>":
            if len(priment) == 2:
                if not (priment[0] == None or priment[1] == None):
                    primary_entity = str(priment[0])
                    retpriment = (str(priment[0]), str(priment[1]))
                    primary_ent_id = rand_ten_gen(id_map.keys())
                    id_map[primary_ent_id] = primary_entity
                    id_map_reverse[primary_entity] = primary_ent_id
                    entity_dict[primary_entity] = set()
                    primary_entity_found = True
    
    if primary_entity_found == False:

        try:
            breakornot = False
            for entlist in entities.values():
                for ent, ent_type in entlist:
                    # print(ent_type)
                    if str(ent_type) == "PERSON" or str(ent_type) == "FAC":
                        primary_entity = ent
                        print("PRIMARY ENTITY:", primary_entity, ent_type)
                        retpriment = (primary_entity, ent_type)
                        breakornot = True
                        
                        primary_ent_id = rand_ten_gen(id_map.keys())
                        id_map[primary_ent_id] = primary_entity # later check to see if this id already exists as poi id in database before assigning it
                        id_map_reverse[primary_entity] = primary_ent_id
                        
                        break
                    if breakornot:
                        break
                if breakornot:
                    break
        
        except:
            print("n")
            pass
        
        if primary_entity is None:
                
            primary_entity = rand_ten_gen(id_map.keys())
            
            primary_ent_id = primary_entity
            id_map[primary_entity] = primary_entity
            id_map_reverse[primary_entity] = primary_entity
            
            retpriment = (primary_entity, "UNKNOWN_TYPE")

    ##### identify and add primary entity to entgraph (END) #####

    ##### connect non socmed and non link and noun phrase entities to entgraph #####

    for entlist in entities.values():
        for ent, ent_type in entlist:            
            if primary_entity:
                links_in_ent = extract_links(ent)
                # if ent != primary_entity and len(links_in_ent) < 1 and ent not in socmed_justvals and ent not in non_socmed_links and "CARDINAL" not in ent_type and ent in doc.ents: # in doc ents to remove nphrases not in doc ents.
                if ent != primary_entity and len(links_in_ent) < 1 and ent not in socmed_justvals and ent not in non_socmed_links and "CARDINAL" not in ent_type:
                    if text.count(ent) > specremove_socmed_justvals.count(remove_special_characters(ent).replace(" ", "")):
                        entity_dict[primary_entity].add((ent, ent_type))

    if parse_nphrases:
    
        entity_dict[primary_entity].add(("highlight_nphrases", "NPHRASES@non_ent_nphrase_parentnode"))
        if "highlight_nphrases" not in entity_dict:
            entity_dict["highlight_nphrases"] = set()
        
        for nphrase in noun_chunks_as_spans_doclevel:
            entity_dict["highlight_nphrases"].add((nphrase.text, nphrase.label_ + "@nphrase"))
            entity_dict[nphrase.text] = set()
    
    if event_defaults and "event_key" in event_defaults:
        entity_dict[primary_entity].add(("event_meta@" + event_defaults["event_key"], "EVENTMETA@eventmetaparent"))
        entity_dict["event_meta@" + event_defaults["event_key"]] = set()
        for key, val in event_defaults.items():
            if key != "event_key":
                entity_dict[val] = set()
                entity_dict["event_meta@" + event_defaults["event_key"]].add((val, "EVENTMETAVAL@"+key))
    
    ##### connect non socmed and non link and noun phrase entities to entgraph (END) #####

    ##### add socmed to entgraph #####

    if len(infosocmed.keys()) > 0:
        for platform, unamelist in infosocmed.items():
            entity_dict[platform] = []
            
            for uname in unamelist:

                entity_dict[platform].append((uname, "SOCMED@socmeduname_group@" + platform))
                entity_dict[uname] = []
                entity_dict[primary_entity].add((uname, "SOCMED@socmeduname_group@" + platform))
            entity_dict[primary_entity].add((platform, "SOCMED@socmedplat"))
    
    ##### add socmed to entgraph (END) #####

    # # Add relationships based on dependency parsing
    # for token in doc:
    #     if token.dep_ in ('nsubj', 'dobj', 'pobj'):
    #         subject = token.head.text
    #         obj = token.text
    #         print(subject, " : ", obj)
    #         if subject in entity_dict and obj in entity_dict:
    #             entity_dict[subject].append(obj)
    #             entity_dict[obj].append(subject)  # If you want the graph to be undirected

    ##### add non-socmed links to entgraph #####

    if len(non_socmed_links) > 0:
        for link in non_socmed_links:
            domainname = extract_domain(link)
            if "nonsocmed_domains" in entity_dict:
                entity_dict[domainname] = set()
                entity_dict["nonsocmed_domains"].add((domainname, "NONSOCMED@domain_name"))
            else:
                entity_dict["nonsocmed_domains"] = set()
                entity_dict[primary_entity].add(("nonsocmed_domains", "NONSOCMED@domain_container"))
                entity_dict["nonsocmed_domains"].add((domainname, "NONSOCMED@domain_name"))
                entity_dict[domainname] = set()

            entity_dict[domainname].add((link, "NONSOCMED@domain_link"))
            entity_dict[link] = set()
            entity_dict[primary_entity].add((link, "NONSOCMED@link")) 
    
    ##### add non-socmed links to entgraph (END) #####

    #### add predefined labelled data to primary entity in entgraph ####
    if len(predefd) > 0:
        if "predefd" not in entity_dict:
            entity_dict["predefd"] = set()
        entity_dict[primary_entity].add(('predefd', 'PREDEFDPARENTNODE@predefd_parent_node'))
        for predefd_tuple in predefd:
            val, edge = predefd_tuple[0], predefd_tuple[1]
            if value not in entity_dict:
                entity_dict[value] = set()
            edgename = 'PREDEFD@predefd_@' + str(edge).upper()
            entity_dict["predefd"].add((val, edgename))

    #### add predefined labelled data to primary entity in entgraph (END) ####    

    ##### identify and link entities in sents from nlp -> entgraph #####

    lastverb = ""
    for sent in doc.sents: 
        sent_entities = []
        # noun_chunks_as_spans_sentlevel = [spacy.tokens.Span(sent.doc, chunk.start, chunk.end, label="NOUN_PHRASE") for chunk in sent.noun_chunks]
        # combd = list(sent.ents) + noun_chunks_as_spans_sentlevel
        for ent in sent.ents:
            label = ent.label_
            for token in ent.root.head.children:
                if token.dep_ == "prep" and token.text == "in":
                    mv = token.head.head.lemma_
                    if lastverb != mv:
                        lastverb = mv
                        label = "event@" + mv
                    else:
                        label = "event@" + lastverb
                elif token.dep_ == "nsubj" and token.head.pos_ == "VERB":
                    mv = token.head.lemma_
                    if lastverb != mv:
                        lastverb = mv
                        label = "role@" + mv
                    else:
                        label = "role@" + lastverb
                else:
                    if ent.root.dep_ in ['nsubj', 'nsubjpass', 'dobj', 'pobj']:  # Subject or object dependencies
                        if "@" not in label:
                            mv = "@" + ent.root.head.head.text
                            if lastverb != mv:
                                lastverb = mv
                                label += mv
                            else:
                                label += lastverb 
            # sent_entities.append((ent.text, ent.label_, label))
            links_in_ent_1 = extract_links(ent.text)
            if len(links_in_ent_1) < 1 and ent.text not in socmed_justvals and ent.text not in non_socmed_links:
                if "CARDINAL" not in label:
                    if text.count(ent.text) > specremove_socmed_justvals.count(remove_special_characters(ent.text).replace(" ", "")):
                        # entity_dict[primary_entity].add((ent, ent_type))
                        entity_start = ent.start
                        last_prep = None

                        # Iterate backwards from the token before the entity -> find the last noun -> modified to find last preposition
                        for token in reversed(doc[:entity_start]):
                            if token.pos_ == "ADP" or token.pos_ == "PART" or token.pos_ == "SCONJ":
                                last_prep = token
                                break

                        entity_start = ent.start
                        last_noun_chunk = None
                        new_label = None

                        # Iterate over noun chunks and find the one that ends before the entity starts
                        for chunk in doc.noun_chunks:
                            if chunk.end <= entity_start:
                                last_noun_chunk = chunk
                            else:
                                break

                        if last_noun_chunk is not None:
                            try:
                                parts = label.split('@', 1)

                                # Insert the value and rejoin the string with an "@" between them
                                new_label = parts[0] + "@" + "@" + parts[1] + "_" + last_noun_chunk.text
                            except:
                                pass

                        if last_prep is not None:
                            try:
                                parts = label.split('@', 1)

                                # Insert the value and rejoin the string with an "@" between them
                                new_label = parts[0] + "@" + "@" + parts[1] + "_" + last_prep.text
                            except:
                                pass
                                
                        if new_label is not None:
                            sent_entities.append((ent.text, new_label))
                        else:
                            sent_entities.append((ent.text, label))
                # else:
                #     sent_entities.append((ent.text, label))

        # sent_entities = [(ent.text, ent.label_) for ent in sent.ents]
        if len(sent_entities) > 1:  # If sentence contains multiple entities
            for i in range(len(sent_entities)):
                entity = sent_entities[i][0]
                # Initialize the entity key if not already present
                if entity not in entity_dict:
                    entity_dict[entity] = set()  # Using a set to avoid duplicates
                # Add relationships with other entities in the same sentence
                for j in range(len(sent_entities)):
                    if i != j:  # Avoid self-loop (an entity cannot be related to itself)
                        # related_entity = sent_entities[j][0]
                        related_entity = sent_entities[j] # removed the zero to also add the relations
                        entity_dict[entity].add(related_entity)
                if firstlayer:
                    break
        # if len(sent_entities) == 1:
        #     entity_dict[sent_entities[0][0]] = set()
            # entity_dict[sent_entities[0][0]].add(sent_entities[0]) # commented because this creates self loops. I was an idiot.

    # Convert sets to lists for final output
    entity_dict = {k: list(v) for k, v in entity_dict.items()}

    entity_dict = add_similarity_edges_by_context(entity_dict, doc, doc.ents)

    ##### identify and link entities in sents from nlp -> entgraph (END) #####
    
    grouped_entity_dict = None
    if group_likeentities:
        grouped_entity_dict = group_like_ents(entity_dict, primary_entity) # group/connect similary entities with common links or parents
        grouped_entity_dict = remove_self_loops(grouped_entity_dict)
    else:
        grouped_entity_dict = entity_dict
        grouped_entity_dict = remove_self_loops(grouped_entity_dict)
    
    
    ##### set unique keys for mapped nodes/entities (all) #####

    for entity_this in grouped_entity_dict.keys():
        if entity_this != primary_entity:
            entid = id_map_reverse[primary_entity] + "->" + rand_ten_gen(id_map.keys())
            id_map[entid] = entity_this
            id_map_reverse[entity_this] = entid
    
    for entity_this in entities.keys():
        if entity_this not in id_map_reverse:
            entityid = id_map_reverse[primary_entity] + "->" + rand_ten_gen(id_map.keys())
            id_map[entityid] = entity_this
            id_map_reverse[entity_this] = entityid

    ##### set unique keys for mapped nodes/entities (all) (END) #####
    
    # grouped_entity_dict = entity_dict
    # for token in doc:
    #     if token.pos_ == "PROPN":
    #         proper_nouns.append(token.text)
    
    # words = word_tokenize(text)
    
    # pos_tagged_words = pos_tag(words)
    
    # chunked_ner = ne_chunk(pos_tagged_words)
    
    
    # for chunk in chunked_ner:
    #     if hasattr(chunk, 'label'):
    #         entity = " ".join(c[0] for c in chunk)
    #         entity_type = chunk.label() 
    #         named_entities.append((entity, entity_type))

    # node existence check
    allnodes = []
    for items, valuelist in grouped_entity_dict.items():
        for value in valuelist:
            if value not in allnodes:
                allnodes.append(value)
    for nodename, nodelink in allnodes:
        if nodename not in grouped_entity_dict:
            grouped_entity_dict[nodename] = set()

    return entities, proper_nouns, ne_nltk_dict, grouped_entity_dict, retpriment, id_map, id_map_reverse, doc, text, entity_pos_map

def combine_paths_to_graph(paths):
    combined_graph = {}
    
    # Iterate through each path (which is a dictionary)
    for path in paths:
        # For each node in the path dictionary, combine the edges
        for node, edges in path.items():
            if node not in combined_graph:
                combined_graph[node] = []
            
            # Add edges for the node, ensuring no duplicate edges
            for edge in edges:
                if edge not in combined_graph[node]:
                    combined_graph[node].append(edge)
    
    return combined_graph

def graph_intersection(graph1, graph2):
    # Initialize the intersection graph
    intersection = {}

    # Iterate over nodes in the first graph
    for node in graph1:
        if node in graph2:  # Check if node is also in the second graph
            # Find common edges by checking adjacency list for the node in both graphs
            common_edges = []
            
            # Convert adjacency lists to sets for easier comparison
            graph1_edges = set(graph1[node])
            graph2_edges = set(graph2[node])
            
            # Find common edges (adjacent node, edge label) present in both graphs
            common_edges = graph1_edges.intersection(graph2_edges)

            # Only add the node to the intersection graph if it has common edges
            if common_edges:
                intersection[node] = list(common_edges)

    return intersection

def remove_self_loops(graph):
    # Iterate over each node and its list of adjacent nodes
    for node in list(graph.keys()):
        # Filter out self-loops by excluding edges where adjacent_node == node
        graph[node] = [(adjacent_node, edge_label) for adjacent_node, edge_label in graph[node] if adjacent_node != node]
    return graph

def graph_union(graph1, graph2):
    # Initialize the union graph
    union = {}

    # Add all nodes and edges from graph1
    for node in graph1:
        if node not in union:
            union[node] = []
        union[node].extend(graph1[node])

    # Add all nodes and edges from graph2
    for node in graph2:
        if node not in union:
            union[node] = []
        union[node].extend(graph2[node])

    # Remove duplicate edges for each node (using sets to avoid duplicates)
    for node in union:
        union[node] = list(set(union[node]))

    return union

def find_all_paths_no_group(graph, start, end):
    def dfs(current_node, end_node, path, visited):
        # If we reached the end, store the path in the paths list
        if current_node == end_node:
            # Convert the current path into the desired dictionary form
            path_dict = {}
            for i in range(len(path) - 1):
                node, next_node = path[i], path[i + 1]
                for neighbor, edge_label in graph[node]:
                    if neighbor == next_node:
                        if node not in path_dict:
                            path_dict[node] = []
                        path_dict[node].append((next_node, edge_label))
            paths.append(path_dict)
            return
        
        # Mark the current node as visited
        visited.add(current_node)
        
        # Explore all adjacent nodes, skipping edges with "_group" in the label
        for neighbor, edge_label in graph[current_node]:
            if neighbor not in visited and "_group_group" not in edge_label:
                dfs(neighbor, end_node, path + [neighbor], visited)
        
        # Unmark the current node (backtracking)
        visited.remove(current_node)

    paths = []
    dfs(start, end, [start], set())
    paths_combined = combine_paths_to_graph(paths)
    # pprint.pprint(paths)
    pprint.pprint(paths_combined)
    return paths, paths_combined

def plot_graph(graph_dict, primnode):
    # print(primnode)  # Really important parameter. Keep.
    plt.close('all')
    G = nx.DiGraph()

    # Add edges and edge labels based on the dictionary
    edge_labels = {}
    for node_id, adjacent_list in graph_dict.items():
        for adjacent_node_id, edge_label in adjacent_list:
            G.add_edge(node_id, adjacent_node_id)  # Add the edge
            edge_labels[(node_id, adjacent_node_id)] = edge_label.split("@")[-1]  # Store the edge label

    # Draw the graph
    pos = nx.spring_layout(G)  # Position the nodes
    degrees = dict(G.degree())

    # Scale node sizes (optional: multiply by a factor for better visibility)
    node_sizes = [degrees[node] * 80 for node in G.nodes()]

    # Draw nodes and edges
    nx.draw(G, pos, with_labels=True, node_color='skyblue', node_size=250, font_size=10, font_weight='bold', arrowstyle='->', arrowsize=20)

    # Draw edge labels
    nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels, font_color='red', font_size=6)

    # Define the click handler inside the function
    def on_click(event):
        # global selected_entities
        if event.inaxes:  # Check if the click is inside the plot area
            click_x, click_y = event.xdata, event.ydata
            for node, (x, y) in pos.items():
                distance = ((click_x - x)**2 + (click_y - y)**2)**0.5
                if distance < 0.1:  # Detect click near node
                    pathsall, pathscombined = find_all_paths_no_group(graph_dict, primnode, node) # map relation to primary entity
                    # selected_entities.append(pathscombined) # store relation to primary entity to later calculate relationship between selected entities
                    break

    # Connect the click event to the on_click function
    fig = plt.gcf()
    fig.canvas.mpl_connect('button_press_event', on_click)

    # Show the plot
    plt.show()

def get_relationship_graph(selected_entitiy_list):  # selected entity list is a list of graphs relating the primary entity to differnt other entities
    n = len(selected_entitiy_list)
    retgraph = {}
    for i in range(n-1):
        for j in range(i + 1, n):
            retgraph = graph_union(retgraph, graph_union(selected_entitiy_list[i], selected_entitiy_list[j])) # cumulation of union of two graphs
    return retgraph

def bfs_dag(graph, start):
    dag_dict = {}
    visited = set()  # To keep track of visited nodes
    queue = deque([str(start)])  # Use a queue for BFS

    while queue:
        current = queue.popleft()  # Dequeue the front element
        visited.add(str(current))  # Mark it as visited
        
        # Initialize the list for the current node if not already present
        if str(current) not in dag_dict:
            dag_dict[str(current)] = []  

        # Explore the neighbors
        for neighbor in graph.get(str(current), []):
            # entity_name = neighbor[0] # Extract only the entity name
            entity_name = str(neighbor)
            if entity_name not in visited:  # Avoid cycles
                dag_dict[str(current)].append(str(entity_name))  # Add directed edge with entity name
                queue.append(str(entity_name))  # Enqueue unvisited neighbors

    return dag_dict

def extract_domain(url):
    parsed_url = urlparse(url)
    domain = parsed_url.netloc
    return domain

def remove_special_characters(text):
    # The regex '[^a-zA-Z0-9\s]' matches anything that's not a letter, digit, or space
    return re.sub(r'[^a-zA-Z0-9\s]', '', text)

def link_is_socmed(link):
    ret1, ret2 = extract_socmed_url(link)
    if ret1 == None or ret2 == None:
        return False
    return True

def extract_links(text):

    url_pattern = re.compile(
        r'(?:(?:http|https)://)?(?:www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}(?:/[^\s]*)?'
    )

    # Process the text using spaCy
    doc = nlp(text)

    links = []

    # Loop through tokens in the text
    for token in doc:
        # Use the regex pattern to find URLs
        if url_pattern.match(token.text):
            links.append(token.text)

    return links

def extract_socmed_emails(txt):
    email_regex = r'(?P<username>[a-zA-Z0-9._-]+)@(?P<platform>[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})'
    
    # Use re.findall to find all matches in the text
    matches = re.findall(email_regex, txt)
    
    # Rebuild the full email address from the captured groups (username and platform)
    emails = [f"{username}@{platform}" for username, platform in matches]
    
    return emails

def extract_socmed_pnos(text):
    # Updated regex pattern to match the phone number exactly as it appears in the text
    phone_regex = r'''
        (?<!\w)                            # Ensure there's no word character before (to avoid partial matches)
        
        # Optional country code with separator (+1, +91, etc.)
        (\+?\d{1,3}[\s.-]?)?               # Country code (optional), followed by separator
        
        # Optional area code with or without parentheses
        (\(?\d{1,4}\)?[\s.-]?)?            # Area code (e.g., (123)), with separator
        
        # Main phone number parts with optional separators (spaces, dashes, or periods)
        \d{1,4}[\s.-]?                     # First part of phone number
        \d{1,4}[\s.-]?                     # Second part of phone number
        \d{1,10}                           # Final part (up to 10 digits)
        
        (?!\w)                             # Ensure there's no word character after (to avoid partial matches)
    '''
    
    # Use re.finditer to capture both the match and its position in the text
    matches = re.finditer(phone_regex, text, re.VERBOSE)
    
    # Return the matched strings exactly as they appear in the text
    phone_numbers = [match.group(0) for match in matches]
    
    return phone_numbers

def extract_socmed_url(url):
    social_media_url_patterns = {
        "Instagram": r"instagram\.com/(?P<username>[a-zA-Z0-9._-]+)",
        "Twitter": r"twitter\.com/(?P<username>[a-zA-Z0-9._-]+)",
        "Facebook": r"facebook\.com/(?P<username>[a-zA-Z0-9._-]+)",
        # LinkedIn (usually /in/username or /company/username)
        "Linkedin": r"linkedin\.com/(in|company)/(?P<username>[a-zA-Z0-9._-]+)",
        "Snapchat": r"snapchat\.com/add/(?P<username>[a-zA-Z0-9._-]+)",
        # TikTok (with or without @)
        "Tiktok": r"tiktok\.com/@?(?P<username>[a-zA-Z0-9._-]+)",
        # YouTube (user, channel, or @username)
        "Youtube": r"youtube\.com/(user|channel|@)(?P<username>[a-zA-Z0-9._-]+)",
        "Pinterest": r"pinterest\.com/(?P<username>[a-zA-Z0-9._-]+)",
        # Reddit (reddit.com/user/username)
        "Reddit": r"reddit\.com/user/(?P<username>[a-zA-Z0-9._-]+)",
        # Tumblr (username.tumblr.com)
        "Tumblr": r"(?P<username>[a-zA-Z0-9._-]+)\.tumblr\.com",
        # WhatsApp (whatsapp.com/send?phone=number)
        "Whatsapp": r"whatsapp\.com/send\?phone=(?P<username>\d+)",
        "Github": r"github\.com/(?P<username>[a-zA-Z0-9._-]+)",
        "Email" : r'(?P<username>[a-zA-Z0-9._-]+)@(?P<platform>[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})',
        "Phone" : r'''
                # Ensure the phone number is not part of a URL or another word
                (?<![a-zA-Z])                # Negative lookbehind to exclude letters before the number

                # Optional country code (e.g., +1, +44, +91, etc.)
                (\+?\d{1,3})?                # Country code (optional), 1-3 digits

                # Optional separator after country code (space, dash, or period)
                [\s.-]?                      

                # Optional area code in parentheses ((123)) or just 123
                (\(?\d{1,4}\)?)              # Area code: (123) or 123, 1-4 digits

                # Separator between area code and the main number (space, dash, or period)
                [\s.-]?

                # Main phone number body (allows spaces or separators between parts)
                (\d{1,4})                    # First group of digits (1-4 digits)
                [\s.-]?                      # Optional separator (space, dash, or period)
                (\d{1,4})                    # Second group of digits (1-4 digits)
                [\s.-]?                      # Optional separator
                (\d{1,9})                    # Final group (up to 9 digits)

                # Ensure the phone number is not immediately followed by letters (to exclude URLs)
                (?![a-zA-Z])                 # Negative lookahead to exclude letters after the number
            '''
    }

    parsed_url = urlparse(url)
    domain = parsed_url.netloc
    path = parsed_url.path
    
    # Combine domain and path for matching
    url_combined = domain + path
    
    for platform, pattern in social_media_url_patterns.items():
        match = re.search(pattern, url_combined)
        if match:
            username = match.group("username")
            return platform, username

    return None, None


def soc_med_extract(text, links=[]):
    social_media_refs = {
        "Instagram": ["instagram", "ig", "insta"],
        "Twitter": ["twitter", "tw", "t", "X"],
        "Facebook": ["facebook", "fb"],
        "Linkedin": ["linkedin", "li", "in"],
        "Snapchat": ["snapchat", "snap"],
        "Tiktok": ["tiktok", "tt"],
        "Youtube": ["youtube", "yt"],
        "Pinterest": ["pinterest", "pin"],
        "Reddit": ["reddit", "rd"],
        "Tumblr": ["tumblr"],
        "Whatsapp": ["whatsapp", "wa"],
        "Github": ["github", "git"],
        "Phone": ["phone", "ph"],
        "Username" : ["user", "username", "uname", "usr"]
    }

    reverse_lookup = {}
    for platform, references in social_media_refs.items():
        for ref in references:
            reverse_lookup[ref] = platform

    pattern = r'(?P<platform>[a-zA-Z]+)@(?P<username>[a-zA-Z0-9._-]+)'
    # e.g ig@user_handle

    handles = {}
    
    # Find all matches in the text
    matches = re.finditer(pattern, text)
    
    for match in matches:
        platform_ref = match.group('platform').lower()
        username = match.group('username')
        
        # Check if the platform reference is in our reverse lookup
        if platform_ref in reverse_lookup:
            platform = reverse_lookup[platform_ref]
            if platform not in handles:
                handles[platform] = [username]
            else:
                if username not in handles[platform]:
                    temp = handles[platform]
                    temp.append(username)
                    handles[platform] = temp

    for link in links:
        plat, uname = extract_socmed_url(link)
        if plat:
            if plat in handles and uname not in handles[plat]:
                temp = handles[plat]
                temp.append(uname)
                handles[plat] = temp
            else:
                handles[plat] = [uname]
    
    socmed_emails = extract_socmed_emails(text)
    # print(socmed_emails)
    if len(socmed_emails) > 0:
        for socmed_email in socmed_emails:
            if "Email" in handles:
                handles["Email"].add(socmed_email)
            else:
                handles["Email"] = set() 
                handles["Email"].add(socmed_email)
        # print(handles["Email"])
    # print(handles)

    socmed_pnos = extract_socmed_pnos(text)
    if len(socmed_pnos) > 0:
        for pno in socmed_pnos:
            if len(pno) > 8:
                if "Phone" in handles:
                    handles["Phone"].add(pno)
                else:
                    handles["Phone"] = set()
                    handles["Phone"].add(pno)
    
    pprint.pprint(handles)

    return handles


try:
    with open("text.txt", "r") as datfile:
        text_data = datfile.read()
except:
    print("n")
    sys.exit()

def main():

    global selected_entities
    global nlp
    #fetch data
    labelled_data = text_data.split("###SEP###")[0]
    about_text_data = text_data.split("###SEP###")[1]
    events_text_data = text_data.split("###SEP###")[2]

    # load nlp
    try:
        nlp = spacy.load("en_core_web_lg")
    except:
        nlp = spacy.load("en_core_web_sm")

    xtracd_links = extract_links(about_text_data)
    ret_ne, ret_pn, nltk_named_ne, entity_graph, primary_entity, ret_id_map, ret_id_map_reverse, doc_nlp, text_orig, entity_pos_map = extract_ne(text=about_text_data, labelledtxt=labelled_data)
    
    # events cant be done the same way as info. do this next
    ret_dates = extract_dates_nlp(about_text_data)
    
    plot_graph(entity_graph, primary_entity[0])
    
    print("##################")
    
    print("\n\n")
    print("RELATIONSHIP GRAPH \n\n")
    relgraph = get_relationship_graph(selected_entities)
    pprint.pprint(relgraph)
    if len(relgraph.keys()) > 0:
    
        plot_graph(relgraph, primary_entity[0])

    # parsed_events = parse_eventtxt(events_text_data)
    # pprint.pprint(parsed_events)
    
main()
