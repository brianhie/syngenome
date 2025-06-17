import json
import sys

# Read the first JSON file (list of nodes)
with open('nodes.json', 'r') as f:
    nodes = json.load(f)

# Read the second JSON file (positions)
with open('positions.json', 'r') as f:
    positions = json.load(f)

# Add position information to each node
for node in nodes:
    node_id = node['id']
    if node_id in positions:
        node['x'] = positions[node_id]['x']
        node['y'] = positions[node_id]['y']
    else:
        # Optional: handle nodes without position data
        print(f"Warning: No position found for node {node_id}")

# Save the updated data to a new JSON file
with open('nodes_with_positions.json', 'w') as f:
    json.dump(nodes, f, indent=2)

print("Position information has been added successfully!")
