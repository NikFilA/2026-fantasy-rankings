#!/usr/bin/env python3
"""Refresh fantasy football ADP data and write it to data.js.

The live scraper targets the FantasyPros best-ball ADP table and reads the
Underdog column by header name. If the remote shape changes, dependencies are
missing, or the request fails, the script falls back to a broad local baseline.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

FANTASYPROS_URL = "https://www.fantasypros.com/nfl/adp/best-ball-overall.php"
DRAFT_SHARKS_URL = "https://www.draftsharks.com/adp/best-ball/half-ppr/underdog/12"
OUTPUT_FILE = Path(__file__).with_name("data.js")
MIN_PLAYERS = 150
SLEEPER_ADP_KEY = "11::107::12"
LEAGUE_SIZE = 12


@dataclass(frozen=True)
class Player:
    id: str
    name: str
    pos: str
    team: str
    udAdp: float
    sleeperAdp: float
    udPick: str = ""
    sleeperPick: str = ""

    def as_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "pos": self.pos,
            "team": self.team,
            "udAdp": int(self.udAdp) if float(self.udAdp).is_integer() else round(float(self.udAdp), 1),
            "udPick": self.udPick,
            "sleeperAdp": int(self.sleeperAdp) if float(self.sleeperAdp).is_integer() else round(float(self.sleeperAdp), 1),
            "sleeperPick": self.sleeperPick,
        }


FALLBACK_ROWS = """
Bijan Robinson,RB,ATL,1.1,1.3
Ja'Marr Chase,WR,CIN,2.2,2.1
Justin Jefferson,WR,MIN,3.1,3.5
Jahmyr Gibbs,RB,DET,4.3,4.2
Malik Nabers,WR,NYG,5.2,5.8
CeeDee Lamb,WR,DAL,6.4,6.1
Saquon Barkley,RB,PHI,7.1,7.5
Puka Nacua,WR,LAR,8.3,8.2
Amon-Ra St. Brown,WR,DET,9.2,9.1
Brock Bowers,TE,LV,10.5,10.3
De'Von Achane,RB,MIA,11.4,12.1
Brian Thomas Jr.,WR,JAC,12.6,12.5
Nico Collins,WR,HOU,13.3,13.8
Christian McCaffrey,RB,SF,14.7,14.2
Drake London,WR,ATL,15.6,15.9
Ashton Jeanty,RB,LV,16.1,16.4
Jonathan Taylor,RB,IND,17.4,17.2
A.J. Brown,WR,NE,18.6,18.3
Ladd McConkey,WR,LAC,19.5,20.1
Josh Allen,QB,BUF,20.3,19.7
Trey McBride,TE,ARI,21.4,21.2
Garrett Wilson,WR,NYJ,22.5,23.1
Marvin Harrison Jr.,WR,ARI,23.6,23.8
Lamar Jackson,QB,BAL,24.4,24.1
Bucky Irving,RB,TB,25.7,26.1
Chase Brown,RB,CIN,26.8,26.4
Jayden Daniels,QB,WAS,27.2,27.8
Kyren Williams,RB,LAR,28.6,28.3
Tee Higgins,WR,CIN,29.5,29.9
Jaxon Smith-Njigba,WR,SEA,30.1,30.8
Tyreek Hill,WR,MIA,31.5,31.4
Mike Evans,WR,TB,32.7,32.1
Kenneth Walker III,RB,SEA,33.4,33.9
Derrick Henry,RB,BAL,34.2,34.5
Terry McLaurin,WR,WAS,35.7,36.2
Davante Adams,WR,LAR,36.8,36.3
James Cook,RB,BUF,37.3,37.9
Omarion Hampton,RB,LAC,38.6,38.2
George Kittle,TE,SF,39.9,39.5
D.J. Moore,WR,CHI,40.4,40.7
Xavier Worthy,WR,KC,41.3,42.0
Rashee Rice,WR,KC,42.6,42.8
Patrick Mahomes,QB,KC,43.5,43.1
Courtland Sutton,WR,DEN,44.8,45.3
DK Metcalf,WR,PIT,45.2,45.8
James Conner,RB,ARI,46.9,46.5
Joe Burrow,QB,CIN,47.4,47.8
Rome Odunze,WR,CHI,48.3,48.6
Zay Flowers,WR,BAL,49.7,49.2
Chris Olave,WR,NO,50.5,51.1
Travis Kelce,TE,KC,51.4,50.9
Isiah Pacheco,RB,KC,52.8,52.4
TreVeyon Henderson,RB,NE,53.1,53.7
Alvin Kamara,RB,NO,54.6,54.3
Tetairoa McMillan,WR,CAR,55.7,56.2
DeVonta Smith,WR,PHI,56.4,55.9
Calvin Ridley,WR,TEN,57.9,58.5
Jaylen Waddle,WR,MIA,58.2,58.1
Sam LaPorta,TE,DET,59.4,59.8
Jerry Jeudy,WR,CLE,60.8,61.1
Jameson Williams,WR,DET,61.7,61.4
Bo Nix,QB,DEN,62.9,63.4
Tony Pollard,RB,TEN,63.5,63.1
Kaleb Johnson,RB,PIT,64.4,65.0
George Pickens,WR,DAL,65.6,65.2
Jordan Addison,WR,MIN,66.8,66.5
Ricky Pearsall,WR,SF,67.3,67.9
David Montgomery,RB,DET,68.5,68.1
T.J. Hockenson,TE,MIN,69.6,69.2
Jalen Hurts,QB,PHI,70.2,70.7
Rhamondre Stevenson,RB,NE,71.8,71.4
Brian Robinson Jr.,RB,WAS,72.5,72.8
Chris Godwin,WR,TB,73.7,73.2
Jakobi Meyers,WR,LV,74.4,74.9
Stefon Diggs,WR,NE,75.9,76.3
Travis Hunter,WR,JAC,76.1,76.7
Tank Dell,WR,HOU,77.4,77.1
Jaylen Warren,RB,PIT,78.8,78.5
Quinshon Judkins,RB,CLE,79.3,79.9
Jauan Jennings,WR,SF,80.7,80.2
Evan Engram,TE,DEN,81.6,81.3
Jordan Love,QB,GB,82.4,82.8
Cooper Kupp,WR,SEA,83.5,83.1
Keon Coleman,WR,BUF,84.8,85.2
Josh Jacobs,RB,GB,85.1,84.7
D'Andre Swift,RB,CHI,86.6,86.9
Deebo Samuel,WR,WAS,87.3,87.8
Emeka Egbuka,WR,TB,88.4,88.9
Matthew Golden,WR,GB,89.7,89.2
J.K. Dobbins,RB,DEN,90.8,90.5
Mark Andrews,TE,BAL,91.2,91.7
Justin Herbert,QB,LAC,92.6,92.3
Javonte Williams,RB,DAL,93.9,94.4
Michael Pittman Jr.,WR,IND,94.2,94.7
Rashid Shaheed,WR,NO,95.5,95.1
Jayden Reed,WR,GB,96.8,96.3
Brandon Aiyuk,WR,SF,97.1,97.9
Tyler Warren,TE,IND,98.7,98.2
Marvin Mims Jr.,WR,DEN,99.6,100.1
Khalil Shakir,WR,BUF,100.4,100.8
Aaron Jones,RB,MIN,101.3,101.7
Najee Harris,RB,LAC,102.8,102.2
RJ Harvey,RB,DEN,103.6,104.1
Breece Hall,RB,NYJ,104.7,104.3
C.J. Stroud,QB,HOU,105.5,105.1
Baker Mayfield,QB,TB,106.9,106.4
Dallas Goedert,TE,PHI,107.2,107.8
Kyle Pitts,TE,ATL,108.5,108.1
Tyrone Tracy Jr.,RB,NYG,109.7,109.3
Cam Skattebo,RB,NYG,110.4,110.9
Zach Charbonnet,RB,SEA,111.6,111.2
Austin Ekeler,RB,WAS,112.8,113.4
Rachaad White,RB,TB,113.5,113.1
Jordan Mason,RB,MIN,114.7,114.3
Isaac Guerendo,RB,SF,115.4,115.9
Braelon Allen,RB,NYJ,116.6,116.1
Blake Corum,RB,LAR,117.8,118.2
Ray Davis,RB,BUF,118.3,118.8
Tyjae Spears,RB,TEN,119.6,119.2
MarShawn Lloyd,RB,GB,120.7,120.4
Bhayshul Tuten,RB,JAC,121.5,122.0
Jerome Ford,RB,CLE,122.9,122.5
Roschon Johnson,RB,CHI,123.2,123.8
Kendre Miller,RB,NO,124.6,124.2
Rico Dowdle,RB,CAR,125.7,126.1
Chuba Hubbard,RB,CAR,126.8,126.4
Cedric Tillman,WR,CLE,127.5,127.9
Josh Downs,WR,IND,128.4,128.1
Christian Kirk,WR,HOU,129.7,129.2
Romeo Doubs,WR,GB,130.3,130.8
Dontayvion Wicks,WR,GB,131.6,131.2
Adonai Mitchell,WR,IND,132.8,132.5
Michael Wilson,WR,ARI,133.4,133.9
Wan'Dale Robinson,WR,NYG,134.7,134.2
Rashod Bateman,WR,BAL,135.5,136.0
Luther Burden III,WR,CHI,136.8,136.4
Jack Bech,WR,LV,137.3,137.9
Jayden Higgins,WR,HOU,138.6,138.2
Tre Harris,WR,LAC,139.7,140.1
Isaac TeSlaa,WR,DET,140.9,140.4
Pat Bryant,WR,DEN,141.2,141.8
Jaylin Noel,WR,HOU,142.6,142.1
Kyle Williams,WR,NE,143.7,144.2
Jalen McMillan,WR,TB,144.4,144.9
Demario Douglas,WR,NE,145.8,145.3
Brandin Cooks,WR,NO,146.5,147.0
Adam Thielen,WR,CAR,147.9,147.4
Elijah Moore,WR,BUF,148.2,148.8
Marquise Brown,WR,KC,149.6,149.1
Xavier Legette,WR,CAR,150.7,151.2
Ja'Lynn Polk,WR,NE,151.5,151.9
Troy Franklin,WR,DEN,152.8,152.4
DeMario Douglas,WR,NE,153.6,154.0
Will Shipley,RB,PHI,154.7,154.3
Jaylen Wright,RB,MIA,155.4,155.8
Kimani Vidal,RB,LAC,156.6,156.2
Tank Bigsby,RB,JAC,157.8,158.3
Tyler Allgeier,RB,ATL,158.5,158.1
Antonio Gibson,RB,NE,159.9,159.4
Justice Hill,RB,BAL,160.2,160.7
Gus Edwards,RB,LAC,161.7,161.3
Kenneth Gainwell,RB,PIT,162.8,162.4
Jaleel McLaughlin,RB,DEN,163.6,164.2
Sean Tucker,RB,TB,164.7,164.3
Drake Maye,QB,NE,165.5,166.1
Caleb Williams,QB,CHI,166.8,166.4
Kyler Murray,QB,ARI,167.3,167.8
Brock Purdy,QB,SF,168.6,168.2
Dak Prescott,QB,DAL,169.7,170.1
Tua Tagovailoa,QB,MIA,170.8,170.3
Anthony Richardson,QB,IND,171.4,171.9
Trevor Lawrence,QB,JAC,172.6,172.1
Jared Goff,QB,DET,173.7,174.2
Michael Penix Jr.,QB,ATL,174.5,174.9
J.J. McCarthy,QB,MIN,175.8,175.3
Bryce Young,QB,CAR,176.6,177.0
Cameron Ward,QB,TEN,177.7,177.2
Geno Smith,QB,LV,178.9,178.4
Sam Darnold,QB,SEA,179.5,180.0
Tucker Kraft,TE,GB,180.4,180.9
David Njoku,TE,CLE,181.8,181.3
Jake Ferguson,TE,DAL,182.6,182.1
Colston Loveland,TE,CHI,183.7,184.2
Jonnu Smith,TE,MIA,184.5,184.9
Dalton Kincaid,TE,BUF,185.8,185.2
Pat Freiermuth,TE,PIT,186.6,187.1
Hunter Henry,TE,NE,187.9,187.4
Brenton Strange,TE,JAC,188.3,188.8
Mike Gesicki,TE,CIN,189.6,189.1
Chig Okonkwo,TE,TEN,190.8,190.3
Theo Johnson,TE,NYG,191.4,191.9
Mason Taylor,TE,NYJ,192.7,192.2
Zach Ertz,TE,WAS,193.5,193.9
Ja'Tavion Sanders,TE,CAR,194.8,194.4
Noah Gray,TE,KC,195.6,196.1
Elijah Arroyo,TE,SEA,196.7,196.2
Oronde Gadsden II,TE,LAC,197.9,197.3
Harold Fannin Jr.,TE,CLE,198.4,198.9
Tyler Higbee,TE,LAR,199.6,199.1
""".strip()


def parse_float(value: Any, default: float = 999.0) -> float:
    if value is None:
        return default
    if isinstance(value, (int, float)):
        return float(value)
    if str(value).strip() in {"", "-", chr(8211), "&nbsp;"}:
        return default
    match = re.search(r"\d+(?:\.\d+)?", str(value).replace(",", ""))
    return float(match.group(0)) if match else default


def overall_to_round_pick(value: float, league_size: int = LEAGUE_SIZE) -> str:
    if value == 999:
        return ""
    pick = max(1, int(round(value)))
    round_number = ((pick - 1) // league_size) + 1
    pick_in_round = ((pick - 1) % league_size) + 1
    return f"{round_number}.{pick_in_round}"


def name_key(name: str) -> str:
    cleaned = re.sub(r"\b(jr|sr|ii|iii|iv|v)\b\.?", "", name.lower())
    return re.sub(r"[^a-z0-9]+", "", cleaned)


def normalize_pos(value: Any) -> str | None:
    pos = str(value or "").upper().strip()
    return pos if pos in {"QB", "RB", "WR", "TE"} else None


def normalize_team(value: Any) -> str:
    team = str(value or "FA").upper().strip()
    return team[:4] if team else "FA"


def fallback_players() -> list[Player]:
    players: list[Player] = []
    for index, row in enumerate(FALLBACK_ROWS.splitlines(), start=1):
        name, pos, team, ud_adp, sleeper_adp = [part.strip() for part in row.split(",", 4)]
        players.append(Player(str(index), name, pos, team, parse_float(ud_adp), parse_float(sleeper_adp)))
    return players


def extract_balanced_json(text: str, start: int) -> str | None:
    opener = text[start]
    closer = "}" if opener == "{" else "]"
    depth = 0
    in_string = False
    escaped = False
    for index in range(start, len(text)):
        char = text[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char == opener:
            depth += 1
        elif char == closer:
            depth -= 1
            if depth == 0:
                return text[start : index + 1]
    return None


def extract_vue_app_data(html: str) -> dict[str, Any]:
    marker = "var vueAppData = "
    start = html.find(marker)
    if start < 0:
        raise RuntimeError("vueAppData payload was not found")
    json_start = start + len(marker)
    raw = extract_balanced_json(html, json_start)
    if not raw:
        raise RuntimeError("vueAppData payload was not complete JSON")
    return json.loads(raw)


def projection_to_sleeper_entry(projection: dict[str, Any]) -> tuple[str, tuple[float, str]] | None:
    adps = projection.get("adps") or {}
    pos = normalize_pos(projection.get("fantasy_position") or projection.get("position"))
    if not pos:
        return None

    first = str(projection.get("first_name") or "").strip()
    last = str(projection.get("last_name") or "").strip()
    name = f"{first} {last}".strip()
    if not name:
        return None

    sleeper = adps.get(SLEEPER_ADP_KEY) or {}
    sleeper_adp = parse_float(sleeper.get("overall_pick_number"))
    sleeper_pick = str(sleeper.get("roundAndPick") or "")
    return name_key(name), (sleeper_adp, sleeper_pick)


def scrape_draft_sharks_sleeper_map(requests: Any, BeautifulSoup: Any) -> dict[str, tuple[float, str]]:
    response = requests.get(
        DRAFT_SHARKS_URL,
        timeout=18,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; ADPBoard/1.0)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    )
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    app_data = extract_vue_app_data(str(soup))
    entries = [
        entry
        for projection in app_data.get("projections") or []
        if (entry := projection_to_sleeper_entry(projection))
    ]
    return dict(entries)


def fantasypros_row_to_player(row: Any, headers: list[str], index: int, sleeper_map: dict[str, tuple[float, str]]) -> Player | None:
    cells = row.find_all("td")
    if len(cells) < len(headers):
        return None

    by_header = {header: cells[cell_index] for cell_index, header in enumerate(headers)}
    player_cell = by_header.get("Player Team (Bye)")
    pos_cell = by_header.get("POS")
    underdog_cell = by_header.get("Underdog")
    if not player_cell or not pos_cell or not underdog_cell:
        return None

    link = player_cell.select_one(".player-name")
    name = (link.get("fp-player-name") if link else "") or (link.get_text(" ", strip=True) if link else "")
    pos = normalize_pos(re.sub(r"\d+$", "", pos_cell.get_text(" ", strip=True)))
    if not name or not pos:
        return None

    smalls = [small.get_text(" ", strip=True) for small in player_cell.find_all("small")]
    team = normalize_team(next((item for item in smalls if not item.startswith("(")), "FA"))
    ud_adp = parse_float(underdog_cell.get_text(" ", strip=True))
    if ud_adp == 999:
        return None

    sleeper_adp, sleeper_pick = sleeper_map.get(name_key(name), (999.0, ""))

    return Player(
        id=str(link.get("class", [""])[-1].replace("fp-id-", "") if link else index),
        name=name.strip(),
        pos=pos,
        team=team,
        udAdp=ud_adp,
        sleeperAdp=sleeper_adp,
        udPick=overall_to_round_pick(ud_adp),
        sleeperPick=sleeper_pick,
    )


def scrape_fantasypros() -> list[Player]:
    try:
        import requests
        from bs4 import BeautifulSoup
    except ImportError as exc:
        raise RuntimeError("requests and beautifulsoup4 are required for live scraping") from exc

    response = requests.get(
        FANTASYPROS_URL,
        timeout=18,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; ADPBoard/1.0)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    )
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    try:
        sleeper_map = scrape_draft_sharks_sleeper_map(requests, BeautifulSoup)
    except Exception:
        sleeper_map = {}

    table = soup.find("table", id="data")
    if not table:
        raise RuntimeError("FantasyPros ADP table was not found")
    headers = [header.get_text(" ", strip=True) for header in table.find_all("th")]
    if "Underdog" not in headers:
        raise RuntimeError("FantasyPros Underdog ADP column was not found")

    players = [
        player
        for index, row in enumerate(table.select("tbody tr"), start=1)
        if (player := fantasypros_row_to_player(row, headers, index, sleeper_map))
    ]
    players.sort(key=lambda player: player.udAdp)
    return [
        Player(
            str(index),
            player.name,
            player.pos,
            player.team,
            player.udAdp,
            player.sleeperAdp,
            player.udPick,
            player.sleeperPick,
        )
        for index, player in enumerate(players, start=1)
    ]


def write_data_js(players: list[Player], path: Path = OUTPUT_FILE) -> None:
    payload = json.dumps([player.as_dict() for player in players], indent=4)
    path.write_text(f"const defaultPlayers = {payload};\n", encoding="utf-8")


def main() -> None:
    source = "live FantasyPros Underdog scrape"
    try:
        players = scrape_fantasypros()
        if len(players) < MIN_PLAYERS:
            raise RuntimeError(f"live scrape returned only {len(players)} players")
    except Exception as exc:
        source = f"local fallback ({exc})"
        players = fallback_players()

    write_data_js(players)
    print(f"Wrote {len(players)} players to {OUTPUT_FILE.name} from {source}.")


if __name__ == "__main__":
    main()
