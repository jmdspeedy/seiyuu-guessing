import os
import json

# File paths
DATA_FILE = "data.json"
ASSETS_DIR = "assets"

def load_data():
    """Load data.json."""
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {"voiceActors": [], "voiceClips": []}

def save_data(data):
    """Save updated data to data.json."""
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def parse_filename(filename):
    """Extract the actor name and clip number from the filename."""
    parts = filename.replace(".mp3", "").split("_")
    if len(parts) >= 3:
        first_name, last_name, number = parts[0], parts[1], parts[2]
        actor_name = f"{first_name.capitalize()} {last_name.capitalize()}"
        return actor_name, int(number)
    return None, None

def update_data():
    """Update data.json with new voiceClips and voiceActors."""
    data = load_data()
    voice_actors = data["voiceActors"]
    voice_clips = data["voiceClips"]

    # Build a map of actor names to IDs for quick lookup
    actor_name_to_id = {actor["name"]: actor["id"] for actor in voice_actors}

    # Start scanning the directory
    for filename in os.listdir(ASSETS_DIR):
        if filename.endswith(".mp3"):
            actor_name, clip_number = parse_filename(filename)
            if actor_name and clip_number:
                # Check if the actor exists, add if not
                if actor_name not in actor_name_to_id:
                    new_actor_id = max([actor["id"] for actor in voice_actors], default=0) + 1
                    voice_actors.append({"id": new_actor_id, "name": actor_name})
                    actor_name_to_id[actor_name] = new_actor_id

                # Check if the clip already exists, add if not
                actor_id = actor_name_to_id[actor_name]
                if not any(clip["file"] == filename for clip in voice_clips):
                    new_clip_id = max([clip["id"] for clip in voice_clips], default=0) + 1
                    voice_clips.append({"id": new_clip_id, "file": filename, "actorId": actor_id})

    # Save updated data
    save_data(data)
    print("Data updated successfully!")

if __name__ == "__main__":
    update_data()
