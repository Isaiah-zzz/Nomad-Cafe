"""Seed mock travelers (users, customers and published stories) for local
development, so GET /game/travelers has something to return.

Safe to run more than once: travelers whose username already exists are skipped.

    cd backend && .venv/bin/python -m scripts.seed_mock_travelers
"""

import secrets

from app.auth.password import hash_password
from app.db.database import SessionLocal
from app.db.models import Customer, Story, User

TRAVELERS = [
    {
        "name": "Mei",
        "personality_traits": "Quiet, notices small details, warms up slowly. Speaks in short, concrete sentences and mentions weather and food.",
        "visual_description": "Small, wrapped in a grey scarf, always holding a warm cup.",
        "stories": [
            {"destination": "Kyoto", "what_happened": "Sat under the arcade in Nishiki Market while it rained, eating tamago and watching umbrellas pass.", "artifact": "A paper umbrella sleeve she kept as a bookmark", "emotion": "calm"},
            {"destination": "Osaka", "what_happened": "On a night bus to Osaka, a stranger shared warm canned coffee with her at a rest stop at 3am.", "emotion": "grateful"},
            {"destination": "Hanoi", "what_happened": "Learned to cross the street by walking slowly and never stopping, while scooters flowed around her like water.", "interesting_things": "An old man selling egg coffee from a doorway no wider than his shoulders.", "emotion": "brave"},
            {"destination": "Jeju Island", "what_happened": "Watched the haenyeo divers come ashore at dusk, laughing and comparing their catch.", "emotion": "moved"},
        ],
    },
    {
        "name": "Luis",
        "personality_traits": "Easy talker who collects city corners and is slightly homesick. Warm, asks questions, jokes a little, compares every café to Lisbon.",
        "visual_description": "Tall, linen shirt, a notebook sticking out of his pocket.",
        "stories": [
            {"destination": "Lisbon", "what_happened": "Tram 28 stalled on a hill and a woman sold him a pastel de nata through the window.", "emotion": "nostalgic"},
            {"destination": "Porto", "what_happened": "Copied azulejo tile patterns into a notebook until the station guard told him the last train was leaving.", "artifact": "The notebook full of tile sketches", "emotion": "absorbed"},
            {"destination": "Seville", "what_happened": "Got invited into a backyard flamenco rehearsal because he was the only one clapping on the off-beat.", "emotion": "delighted"},
            {"destination": "Madeira", "what_happened": "Rode a wicker toboggan down the streets of Monte, steered by two men in straw hats.", "emotion": "giddy"},
        ],
    },
    {
        "name": "Anya",
        "personality_traits": "Dry humor, likes long routes, hates small talk that goes nowhere. Blunt at first, then suddenly generous with a story if someone earns it.",
        "visual_description": "Heavy boots, cropped hair, a battered thermos.",
        "stories": [
            {"destination": "Irkutsk", "what_happened": "Four days on the Trans-Siberian train. A stranger taught her card names in Russian using leftover bread.", "emotion": "amused"},
            {"destination": "Lake Baikal", "what_happened": "The lake ice made sounds like a whale. She recorded it and never posted it.", "interesting_things": "The ice was so clear she could see stones a meter down.", "artifact": "A voice memo of the ice", "emotion": "awed"},
            {"destination": "Ulaanbaatar", "what_happened": "Spent a night in a ger where the host fed the stove dried dung every hour and never once woke her.", "emotion": "cared for"},
        ],
    },
    {
        "name": "Kenji",
        "personality_traits": "Restless, maps everything, gets fidgety if the room goes quiet. Talks quickly about times, routes and where he is going next.",
        "visual_description": "Backpack still on, phone with a cracked screen full of maps.",
        "stories": [
            {"destination": "Hokkaido", "what_happened": "Took the last sleeper train before it was retired and stayed awake all night on purpose.", "emotion": "bittersweet"},
            {"destination": "Taipei", "what_happened": "Found a city map left on a hostel bunk with three breakfast shops circled, and visited all three.", "artifact": "The circled map", "emotion": "delighted"},
            {"destination": "Hong Kong", "what_happened": "Rode the Star Ferry back and forth six times because a harbor fog made the skyline appear and vanish.", "emotion": "mesmerized"},
            {"destination": "Busan", "what_happened": "Missed his train by one minute and ended up eating grilled eel with the station cleaners.", "emotion": "lucky"},
        ],
    },
    {
        "name": "Samira",
        "personality_traits": "Curious about other people's journeys and offers to share tea. Soft-spoken, asks more than she tells, returns to one vivid image instead of listing places.",
        "visual_description": "Patterned shawl, a small brass teapot in her bag.",
        "stories": [
            {"destination": "Mhamid, Morocco", "what_happened": "The van stopped because dunes had covered the road, and someone poured mint tea on the hood while they waited.", "emotion": "peaceful"},
            {"destination": "Fès", "what_happened": "Got lost in the medina and followed the smell of cedar until she found a door she had already passed twice.", "emotion": "curious"},
            {"destination": "Istanbul", "what_happened": "A ferry seller taught her to throw simit pieces so the gulls caught them mid-air.", "emotion": "playful"},
        ],
    },
    {
        "name": "Tomás",
        "personality_traits": "Gentle, a little clumsy, laughs at himself first. Loves mountains and talks about altitude like other people talk about weather.",
        "visual_description": "Sunburnt nose, wool beanie even indoors, hiking poles strapped to his bag.",
        "stories": [
            {"destination": "Cusco", "what_happened": "Got altitude sickness on day one and a grandmother at the market cured him with coca tea and a stern look.", "emotion": "humbled"},
            {"destination": "Torres del Paine", "what_happened": "The wind knocked him flat on the trail and a guanaco watched him get up, unimpressed.", "emotion": "amused"},
            {"destination": "Salar de Uyuni", "what_happened": "After rain the salt flat turned into a mirror and he couldn't tell where the sky ended.", "artifact": "A pinch of salt in a film canister", "emotion": "awed"},
        ],
    },
    {
        "name": "Priya",
        "personality_traits": "Sharp, organized, secretly sentimental. Plans everything to the minute, then remembers only the moments the plan fell apart.",
        "visual_description": "Neat braid, a camera on a leather strap, a color-coded notebook.",
        "stories": [
            {"destination": "Varanasi", "what_happened": "Woke at 4am for the river and found her grandfather's favorite song playing from a boat.", "emotion": "tender"},
            {"destination": "Iceland", "what_happened": "Her rental car battery died at a waterfall and a sheep farmer jump-started it while explaining how to name lambs.", "emotion": "grateful"},
            {"destination": "Edinburgh", "what_happened": "Ducked into a bookshop to escape the rain and left three hours later with a stranger's annotated poetry book.", "artifact": "The annotated poetry book", "emotion": "charmed"},
        ],
    },
    {
        "name": "Ola",
        "personality_traits": "Big laugh, tells stories with his hands, always hungry. Turns every trip into a story about a meal.",
        "visual_description": "Bright patterned shirt, round glasses, a canvas tote full of snacks.",
        "stories": [
            {"destination": "Lagos", "what_happened": "Haggled for an hour at Balogun market and the trader gave him the shirt for free because he made her laugh.", "artifact": "The patterned shirt he is wearing", "emotion": "proud"},
            {"destination": "Naples", "what_happened": "A pizzaiolo let him stretch one dough, then threw it away and made him a proper one.", "emotion": "delighted"},
            {"destination": "Penang", "what_happened": "Ate at seven hawker stalls in one night and ranked them on a napkin he still keeps.", "artifact": "The napkin ranking", "emotion": "satisfied"},
        ],
    },
]


def main():
    db = SessionLocal()
    try:
        for t in TRAVELERS:
            username = "mock_" + t["name"].lower().replace("á", "a")
            if db.query(User).filter(User.username == username).first():
                print(f"skip {t['name']} (already seeded)")
                continue
            user = User(
                username=username,
                email=f"{username}@example.com",
                # Mock accounts are never logged into.
                password_hash=hash_password(secrets.token_urlsafe(16)),
            )
            db.add(user)
            db.flush()
            customer = Customer(
                name=t["name"],
                personality_traits=t["personality_traits"],
                visual_description=t["visual_description"],
                user_id=user.id,
            )
            db.add(customer)
            db.flush()
            for s in t["stories"]:
                db.add(Story(customer_id=customer.id, status="published", **s))
            print(f"seeded {t['name']} with {len(t['stories'])} stories")
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()
