const defaultPlayers = [
    {
        "id": "1",
        "name": "Bijan Robinson",
        "pos": "RB",
        "team": "ATL",
        "udAdp": 1,
        "udPick": "1.1",
        "sleeperAdp": 1,
        "sleeperPick": "1.1"
    },
    {
        "id": "2",
        "name": "Jahmyr Gibbs",
        "pos": "RB",
        "team": "DET",
        "udAdp": 2,
        "udPick": "1.2",
        "sleeperAdp": 2,
        "sleeperPick": "1.2"
    },
    {
        "id": "3",
        "name": "Ja'Marr Chase",
        "pos": "WR",
        "team": "CIN",
        "udAdp": 3,
        "udPick": "1.3",
        "sleeperAdp": 3,
        "sleeperPick": "1.3"
    },
    {
        "id": "4",
        "name": "Puka Nacua",
        "pos": "WR",
        "team": "LAR",
        "udAdp": 4,
        "udPick": "1.4",
        "sleeperAdp": 4,
        "sleeperPick": "1.4"
    },
    {
        "id": "5",
        "name": "Jaxon Smith-Njigba",
        "pos": "WR",
        "team": "SEA",
        "udAdp": 5,
        "udPick": "1.5",
        "sleeperAdp": 5,
        "sleeperPick": "1.5"
    },
    {
        "id": "6",
        "name": "Jonathan Taylor",
        "pos": "RB",
        "team": "IND",
        "udAdp": 6,
        "udPick": "1.6",
        "sleeperAdp": 7,
        "sleeperPick": "1.7"
    },
    {
        "id": "7",
        "name": "Christian McCaffrey",
        "pos": "RB",
        "team": "SF",
        "udAdp": 7,
        "udPick": "1.7",
        "sleeperAdp": 6,
        "sleeperPick": "1.6"
    },
    {
        "id": "8",
        "name": "Amon-Ra St. Brown",
        "pos": "WR",
        "team": "DET",
        "udAdp": 8,
        "udPick": "1.8",
        "sleeperAdp": 10,
        "sleeperPick": "1.10"
    },
    {
        "id": "9",
        "name": "CeeDee Lamb",
        "pos": "WR",
        "team": "DAL",
        "udAdp": 9,
        "udPick": "1.9",
        "sleeperAdp": 9,
        "sleeperPick": "1.9"
    },
    {
        "id": "10",
        "name": "Justin Jefferson",
        "pos": "WR",
        "team": "MIN",
        "udAdp": 10,
        "udPick": "1.10",
        "sleeperAdp": 11,
        "sleeperPick": "1.11"
    },
    {
        "id": "11",
        "name": "James Cook III",
        "pos": "RB",
        "team": "BUF",
        "udAdp": 11,
        "udPick": "1.11",
        "sleeperAdp": 8,
        "sleeperPick": "1.8"
    },
    {
        "id": "12",
        "name": "Ashton Jeanty",
        "pos": "RB",
        "team": "LV",
        "udAdp": 12,
        "udPick": "1.12",
        "sleeperAdp": 14,
        "sleeperPick": "2.2"
    },
    {
        "id": "13",
        "name": "De'Von Achane",
        "pos": "RB",
        "team": "MIA",
        "udAdp": 13,
        "udPick": "2.1",
        "sleeperAdp": 15,
        "sleeperPick": "2.3"
    },
    {
        "id": "14",
        "name": "Saquon Barkley",
        "pos": "RB",
        "team": "PHI",
        "udAdp": 14,
        "udPick": "2.2",
        "sleeperAdp": 19,
        "sleeperPick": "2.7"
    },
    {
        "id": "15",
        "name": "Omarion Hampton",
        "pos": "RB",
        "team": "LAC",
        "udAdp": 15,
        "udPick": "2.3",
        "sleeperAdp": 17,
        "sleeperPick": "2.5"
    },
    {
        "id": "16",
        "name": "Kenneth Walker III",
        "pos": "RB",
        "team": "KC",
        "udAdp": 16,
        "udPick": "2.4",
        "sleeperAdp": 13,
        "sleeperPick": "2.1"
    },
    {
        "id": "17",
        "name": "Derrick Henry",
        "pos": "RB",
        "team": "BAL",
        "udAdp": 17,
        "udPick": "2.5",
        "sleeperAdp": 31,
        "sleeperPick": "3.7"
    },
    {
        "id": "18",
        "name": "Chase Brown",
        "pos": "RB",
        "team": "CIN",
        "udAdp": 18,
        "udPick": "2.6",
        "sleeperAdp": 22,
        "sleeperPick": "2.10"
    },
    {
        "id": "19",
        "name": "Drake London",
        "pos": "WR",
        "team": "ATL",
        "udAdp": 19,
        "udPick": "2.7",
        "sleeperAdp": 12,
        "sleeperPick": "1.12"
    },
    {
        "id": "20",
        "name": "Brock Bowers",
        "pos": "TE",
        "team": "LV",
        "udAdp": 20,
        "udPick": "2.8",
        "sleeperAdp": 25,
        "sleeperPick": "3.1"
    },
    {
        "id": "21",
        "name": "Jeremiyah Love",
        "pos": "RB",
        "team": "ARI",
        "udAdp": 21,
        "udPick": "2.9",
        "sleeperAdp": 20,
        "sleeperPick": "2.8"
    },
    {
        "id": "22",
        "name": "George Pickens",
        "pos": "WR",
        "team": "DAL",
        "udAdp": 22,
        "udPick": "2.10",
        "sleeperAdp": 23,
        "sleeperPick": "2.11"
    },
    {
        "id": "23",
        "name": "Malik Nabers",
        "pos": "WR",
        "team": "NYG",
        "udAdp": 23,
        "udPick": "2.11",
        "sleeperAdp": 18,
        "sleeperPick": "2.6"
    },
    {
        "id": "24",
        "name": "Nico Collins",
        "pos": "WR",
        "team": "HOU",
        "udAdp": 24,
        "udPick": "2.12",
        "sleeperAdp": 21,
        "sleeperPick": "2.9"
    },
    {
        "id": "25",
        "name": "Trey McBride",
        "pos": "TE",
        "team": "ARI",
        "udAdp": 25,
        "udPick": "3.1",
        "sleeperAdp": 16,
        "sleeperPick": "2.4"
    },
    {
        "id": "26",
        "name": "Josh Jacobs",
        "pos": "RB",
        "team": "GB",
        "udAdp": 26,
        "udPick": "3.2",
        "sleeperAdp": 26,
        "sleeperPick": "3.2"
    },
    {
        "id": "27",
        "name": "A.J. Brown",
        "pos": "WR",
        "team": "PHI",
        "udAdp": 27,
        "udPick": "3.3",
        "sleeperAdp": 28,
        "sleeperPick": "3.4"
    },
    {
        "id": "28",
        "name": "Rashee Rice",
        "pos": "WR",
        "team": "KC",
        "udAdp": 28,
        "udPick": "3.4",
        "sleeperAdp": 30,
        "sleeperPick": "3.6"
    },
    {
        "id": "29",
        "name": "Breece Hall",
        "pos": "RB",
        "team": "NYJ",
        "udAdp": 29,
        "udPick": "3.5",
        "sleeperAdp": 35,
        "sleeperPick": "3.11"
    },
    {
        "id": "30",
        "name": "Josh Allen",
        "pos": "QB",
        "team": "BUF",
        "udAdp": 30,
        "udPick": "3.6",
        "sleeperAdp": 27,
        "sleeperPick": "3.3"
    },
    {
        "id": "31",
        "name": "Travis Etienne Jr.",
        "pos": "RB",
        "team": "NO",
        "udAdp": 31,
        "udPick": "3.7",
        "sleeperAdp": 39,
        "sleeperPick": "4.3"
    },
    {
        "id": "32",
        "name": "DeVonta Smith",
        "pos": "WR",
        "team": "PHI",
        "udAdp": 32,
        "udPick": "3.8",
        "sleeperAdp": 49,
        "sleeperPick": "5.1"
    },
    {
        "id": "33",
        "name": "Chris Olave",
        "pos": "WR",
        "team": "NO",
        "udAdp": 33,
        "udPick": "3.9",
        "sleeperAdp": 24,
        "sleeperPick": "2.12"
    },
    {
        "id": "34",
        "name": "Kyren Williams",
        "pos": "RB",
        "team": "LAR",
        "udAdp": 34,
        "udPick": "3.10",
        "sleeperAdp": 36,
        "sleeperPick": "3.12"
    },
    {
        "id": "35",
        "name": "Tee Higgins",
        "pos": "WR",
        "team": "CIN",
        "udAdp": 35,
        "udPick": "3.11",
        "sleeperAdp": 32,
        "sleeperPick": "3.8"
    },
    {
        "id": "36",
        "name": "Javonte Williams",
        "pos": "RB",
        "team": "DAL",
        "udAdp": 36,
        "udPick": "3.12",
        "sleeperAdp": 40,
        "sleeperPick": "4.4"
    },
    {
        "id": "37",
        "name": "Tetairoa McMillan",
        "pos": "WR",
        "team": "CAR",
        "udAdp": 37,
        "udPick": "4.1",
        "sleeperAdp": 33,
        "sleeperPick": "3.9"
    },
    {
        "id": "38",
        "name": "Zay Flowers",
        "pos": "WR",
        "team": "BAL",
        "udAdp": 38,
        "udPick": "4.2",
        "sleeperAdp": 46,
        "sleeperPick": "4.10"
    },
    {
        "id": "39",
        "name": "Garrett Wilson",
        "pos": "WR",
        "team": "NYJ",
        "udAdp": 39,
        "udPick": "4.3",
        "sleeperAdp": 37,
        "sleeperPick": "4.1"
    },
    {
        "id": "40",
        "name": "Emeka Egbuka",
        "pos": "WR",
        "team": "TB",
        "udAdp": 40,
        "udPick": "4.4",
        "sleeperAdp": 50,
        "sleeperPick": "5.2"
    },
    {
        "id": "41",
        "name": "Ladd McConkey",
        "pos": "WR",
        "team": "LAC",
        "udAdp": 41,
        "udPick": "4.5",
        "sleeperAdp": 44,
        "sleeperPick": "4.8"
    },
    {
        "id": "42",
        "name": "Luther Burden III",
        "pos": "WR",
        "team": "CHI",
        "udAdp": 42,
        "udPick": "4.6",
        "sleeperAdp": 38,
        "sleeperPick": "4.2"
    },
    {
        "id": "43",
        "name": "Cam Skattebo",
        "pos": "RB",
        "team": "NYG",
        "udAdp": 43,
        "udPick": "4.7",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "44",
        "name": "Bucky Irving",
        "pos": "RB",
        "team": "TB",
        "udAdp": 44,
        "udPick": "4.8",
        "sleeperAdp": 29,
        "sleeperPick": "3.5"
    },
    {
        "id": "45",
        "name": "Mike Evans",
        "pos": "WR",
        "team": "SF",
        "udAdp": 45,
        "udPick": "4.9",
        "sleeperAdp": 59,
        "sleeperPick": "5.11"
    },
    {
        "id": "46",
        "name": "Colston Loveland",
        "pos": "TE",
        "team": "CHI",
        "udAdp": 46,
        "udPick": "4.10",
        "sleeperAdp": 45,
        "sleeperPick": "4.9"
    },
    {
        "id": "47",
        "name": "Jameson Williams",
        "pos": "WR",
        "team": "DET",
        "udAdp": 47,
        "udPick": "4.11",
        "sleeperAdp": 47,
        "sleeperPick": "4.11"
    },
    {
        "id": "48",
        "name": "TreVeyon Henderson",
        "pos": "RB",
        "team": "NE",
        "udAdp": 48,
        "udPick": "4.12",
        "sleeperAdp": 48,
        "sleeperPick": "4.12"
    },
    {
        "id": "49",
        "name": "David Montgomery",
        "pos": "RB",
        "team": "HOU",
        "udAdp": 49,
        "udPick": "5.1",
        "sleeperAdp": 66,
        "sleeperPick": "6.6"
    },
    {
        "id": "50",
        "name": "Jaylen Waddle",
        "pos": "WR",
        "team": "DEN",
        "udAdp": 50,
        "udPick": "5.2",
        "sleeperAdp": 41,
        "sleeperPick": "4.5"
    },
    {
        "id": "51",
        "name": "Terry McLaurin",
        "pos": "WR",
        "team": "WAS",
        "udAdp": 51,
        "udPick": "5.3",
        "sleeperAdp": 51,
        "sleeperPick": "5.3"
    },
    {
        "id": "52",
        "name": "Davante Adams",
        "pos": "WR",
        "team": "LAR",
        "udAdp": 52,
        "udPick": "5.4",
        "sleeperAdp": 43,
        "sleeperPick": "4.7"
    },
    {
        "id": "53",
        "name": "D'Andre Swift",
        "pos": "RB",
        "team": "CHI",
        "udAdp": 53,
        "udPick": "5.5",
        "sleeperAdp": 61,
        "sleeperPick": "6.1"
    },
    {
        "id": "54",
        "name": "DJ Moore",
        "pos": "WR",
        "team": "BUF",
        "udAdp": 54,
        "udPick": "5.6",
        "sleeperAdp": 55,
        "sleeperPick": "5.7"
    },
    {
        "id": "55",
        "name": "Quinshon Judkins",
        "pos": "RB",
        "team": "CLE",
        "udAdp": 55,
        "udPick": "5.7",
        "sleeperAdp": 63,
        "sleeperPick": "6.3"
    },
    {
        "id": "56",
        "name": "Lamar Jackson",
        "pos": "QB",
        "team": "BAL",
        "udAdp": 56,
        "udPick": "5.8",
        "sleeperAdp": 34,
        "sleeperPick": "3.10"
    },
    {
        "id": "57",
        "name": "Rome Odunze",
        "pos": "WR",
        "team": "CHI",
        "udAdp": 57,
        "udPick": "5.9",
        "sleeperAdp": 68,
        "sleeperPick": "6.8"
    },
    {
        "id": "58",
        "name": "Jadarian Price",
        "pos": "RB",
        "team": "SEA",
        "udAdp": 58,
        "udPick": "5.10",
        "sleeperAdp": 132,
        "sleeperPick": "11.12"
    },
    {
        "id": "59",
        "name": "Christian Watson",
        "pos": "WR",
        "team": "GB",
        "udAdp": 59,
        "udPick": "5.11",
        "sleeperAdp": 65,
        "sleeperPick": "6.5"
    },
    {
        "id": "60",
        "name": "Bhayshul Tuten",
        "pos": "RB",
        "team": "JAC",
        "udAdp": 60,
        "udPick": "5.12",
        "sleeperAdp": 57,
        "sleeperPick": "5.9"
    },
    {
        "id": "61",
        "name": "Carnell Tate",
        "pos": "WR",
        "team": "TEN",
        "udAdp": 61,
        "udPick": "6.1",
        "sleeperAdp": 60,
        "sleeperPick": "5.12"
    },
    {
        "id": "62",
        "name": "Jordyn Tyson",
        "pos": "WR",
        "team": "NO",
        "udAdp": 62,
        "udPick": "6.2",
        "sleeperAdp": 69,
        "sleeperPick": "6.9"
    },
    {
        "id": "63",
        "name": "Joe Burrow",
        "pos": "QB",
        "team": "CIN",
        "udAdp": 63,
        "udPick": "6.3",
        "sleeperAdp": 52,
        "sleeperPick": "5.4"
    },
    {
        "id": "64",
        "name": "Brian Thomas Jr.",
        "pos": "WR",
        "team": "JAC",
        "udAdp": 64,
        "udPick": "6.4",
        "sleeperAdp": 80,
        "sleeperPick": "7.8"
    },
    {
        "id": "65",
        "name": "Jayden Daniels",
        "pos": "QB",
        "team": "WAS",
        "udAdp": 65,
        "udPick": "6.5",
        "sleeperAdp": 58,
        "sleeperPick": "5.10"
    },
    {
        "id": "66",
        "name": "Tyler Warren",
        "pos": "TE",
        "team": "IND",
        "udAdp": 66,
        "udPick": "6.6",
        "sleeperAdp": 53,
        "sleeperPick": "5.5"
    },
    {
        "id": "67",
        "name": "Marvin Harrison Jr.",
        "pos": "WR",
        "team": "ARI",
        "udAdp": 67,
        "udPick": "6.7",
        "sleeperAdp": 85,
        "sleeperPick": "8.1"
    },
    {
        "id": "68",
        "name": "Chuba Hubbard",
        "pos": "RB",
        "team": "CAR",
        "udAdp": 68,
        "udPick": "6.8",
        "sleeperAdp": 91,
        "sleeperPick": "8.7"
    },
    {
        "id": "69",
        "name": "Jalen Hurts",
        "pos": "QB",
        "team": "PHI",
        "udAdp": 69,
        "udPick": "6.9",
        "sleeperAdp": 62,
        "sleeperPick": "6.2"
    },
    {
        "id": "70",
        "name": "Caleb Williams",
        "pos": "QB",
        "team": "CHI",
        "udAdp": 70,
        "udPick": "6.10",
        "sleeperAdp": 81,
        "sleeperPick": "7.9"
    },
    {
        "id": "71",
        "name": "Drake Maye",
        "pos": "QB",
        "team": "NE",
        "udAdp": 71,
        "udPick": "6.11",
        "sleeperAdp": 42,
        "sleeperPick": "4.6"
    },
    {
        "id": "72",
        "name": "Alec Pierce",
        "pos": "WR",
        "team": "IND",
        "udAdp": 72,
        "udPick": "6.12",
        "sleeperAdp": 95,
        "sleeperPick": "8.11"
    },
    {
        "id": "73",
        "name": "Makai Lemon",
        "pos": "WR",
        "team": "PHI",
        "udAdp": 73,
        "udPick": "7.1",
        "sleeperAdp": 78,
        "sleeperPick": "7.6"
    },
    {
        "id": "74",
        "name": "Parker Washington",
        "pos": "WR",
        "team": "JAC",
        "udAdp": 74,
        "udPick": "7.2",
        "sleeperAdp": 98,
        "sleeperPick": "9.2"
    },
    {
        "id": "75",
        "name": "Rhamondre Stevenson",
        "pos": "RB",
        "team": "NE",
        "udAdp": 75,
        "udPick": "7.3",
        "sleeperAdp": 75,
        "sleeperPick": "7.3"
    },
    {
        "id": "76",
        "name": "DK Metcalf",
        "pos": "WR",
        "team": "PIT",
        "udAdp": 76,
        "udPick": "7.4",
        "sleeperAdp": 73,
        "sleeperPick": "7.1"
    },
    {
        "id": "77",
        "name": "Tony Pollard",
        "pos": "RB",
        "team": "TEN",
        "udAdp": 77,
        "udPick": "7.5",
        "sleeperAdp": 87,
        "sleeperPick": "8.3"
    },
    {
        "id": "78",
        "name": "Dak Prescott",
        "pos": "QB",
        "team": "DAL",
        "udAdp": 78,
        "udPick": "7.6",
        "sleeperAdp": 90,
        "sleeperPick": "8.6"
    },
    {
        "id": "79",
        "name": "Jaylen Warren",
        "pos": "RB",
        "team": "PIT",
        "udAdp": 79,
        "udPick": "7.7",
        "sleeperAdp": 67,
        "sleeperPick": "6.7"
    },
    {
        "id": "80",
        "name": "Tucker Kraft",
        "pos": "TE",
        "team": "GB",
        "udAdp": 80,
        "udPick": "7.8",
        "sleeperAdp": 70,
        "sleeperPick": "6.10"
    },
    {
        "id": "81",
        "name": "Courtland Sutton",
        "pos": "WR",
        "team": "DEN",
        "udAdp": 81,
        "udPick": "7.9",
        "sleeperAdp": 71,
        "sleeperPick": "6.11"
    },
    {
        "id": "82",
        "name": "Jayden Reed",
        "pos": "WR",
        "team": "GB",
        "udAdp": 82,
        "udPick": "7.10",
        "sleeperAdp": 126,
        "sleeperPick": "11.6"
    },
    {
        "id": "83",
        "name": "Justin Herbert",
        "pos": "QB",
        "team": "LAC",
        "udAdp": 83,
        "udPick": "7.11",
        "sleeperAdp": 76,
        "sleeperPick": "7.4"
    },
    {
        "id": "84",
        "name": "RJ Harvey",
        "pos": "RB",
        "team": "DEN",
        "udAdp": 84,
        "udPick": "7.12",
        "sleeperAdp": 54,
        "sleeperPick": "5.6"
    },
    {
        "id": "85",
        "name": "Jordan Addison",
        "pos": "WR",
        "team": "MIN",
        "udAdp": 85,
        "udPick": "8.1",
        "sleeperAdp": 105,
        "sleeperPick": "9.9"
    },
    {
        "id": "86",
        "name": "Trevor Lawrence",
        "pos": "QB",
        "team": "JAC",
        "udAdp": 86,
        "udPick": "8.2",
        "sleeperAdp": 86,
        "sleeperPick": "8.2"
    },
    {
        "id": "87",
        "name": "Rico Dowdle",
        "pos": "RB",
        "team": "PIT",
        "udAdp": 87,
        "udPick": "8.3",
        "sleeperAdp": 88,
        "sleeperPick": "8.4"
    },
    {
        "id": "88",
        "name": "Michael Wilson",
        "pos": "WR",
        "team": "ARI",
        "udAdp": 88,
        "udPick": "8.4",
        "sleeperAdp": 77,
        "sleeperPick": "7.5"
    },
    {
        "id": "89",
        "name": "Chris Godwin Jr.",
        "pos": "WR",
        "team": "TB",
        "udAdp": 89,
        "udPick": "8.5",
        "sleeperAdp": 96,
        "sleeperPick": "8.12"
    },
    {
        "id": "90",
        "name": "Kyle Monangai",
        "pos": "RB",
        "team": "CHI",
        "udAdp": 90,
        "udPick": "8.6",
        "sleeperAdp": 82,
        "sleeperPick": "7.10"
    },
    {
        "id": "91",
        "name": "Jaxson Dart",
        "pos": "QB",
        "team": "NYG",
        "udAdp": 91,
        "udPick": "8.7",
        "sleeperAdp": 74,
        "sleeperPick": "7.2"
    },
    {
        "id": "92",
        "name": "Harold Fannin Jr.",
        "pos": "TE",
        "team": "CLE",
        "udAdp": 92,
        "udPick": "8.8",
        "sleeperAdp": 64,
        "sleeperPick": "6.4"
    },
    {
        "id": "93",
        "name": "Patrick Mahomes II",
        "pos": "QB",
        "team": "KC",
        "udAdp": 93,
        "udPick": "8.9",
        "sleeperAdp": 94,
        "sleeperPick": "8.10"
    },
    {
        "id": "94",
        "name": "Quentin Johnston",
        "pos": "WR",
        "team": "LAC",
        "udAdp": 94,
        "udPick": "8.10",
        "sleeperAdp": 116,
        "sleeperPick": "10.8"
    },
    {
        "id": "95",
        "name": "Blake Corum",
        "pos": "RB",
        "team": "LAR",
        "udAdp": 95,
        "udPick": "8.11",
        "sleeperAdp": 92,
        "sleeperPick": "8.8"
    },
    {
        "id": "96",
        "name": "Jakobi Meyers",
        "pos": "WR",
        "team": "JAC",
        "udAdp": 96,
        "udPick": "8.12",
        "sleeperAdp": 79,
        "sleeperPick": "7.7"
    },
    {
        "id": "97",
        "name": "Sam LaPorta",
        "pos": "TE",
        "team": "DET",
        "udAdp": 97,
        "udPick": "9.1",
        "sleeperAdp": 83,
        "sleeperPick": "7.11"
    },
    {
        "id": "98",
        "name": "Brock Purdy",
        "pos": "QB",
        "team": "SF",
        "udAdp": 98,
        "udPick": "9.2",
        "sleeperAdp": 97,
        "sleeperPick": "9.1"
    },
    {
        "id": "99",
        "name": "Josh Downs",
        "pos": "WR",
        "team": "IND",
        "udAdp": 99,
        "udPick": "9.3",
        "sleeperAdp": 145,
        "sleeperPick": "13.1"
    },
    {
        "id": "100",
        "name": "Ricky Pearsall",
        "pos": "WR",
        "team": "SF",
        "udAdp": 100,
        "udPick": "9.4",
        "sleeperAdp": 93,
        "sleeperPick": "8.9"
    },
    {
        "id": "101",
        "name": "Bo Nix",
        "pos": "QB",
        "team": "DEN",
        "udAdp": 101,
        "udPick": "9.5",
        "sleeperAdp": 115,
        "sleeperPick": "10.7"
    },
    {
        "id": "102",
        "name": "J.K. Dobbins",
        "pos": "RB",
        "team": "DEN",
        "udAdp": 102,
        "udPick": "9.6",
        "sleeperAdp": 101,
        "sleeperPick": "9.5"
    },
    {
        "id": "103",
        "name": "Kyle Pitts Sr.",
        "pos": "TE",
        "team": "ATL",
        "udAdp": 103,
        "udPick": "9.7",
        "sleeperAdp": 72,
        "sleeperPick": "6.12"
    },
    {
        "id": "104",
        "name": "Matthew Stafford",
        "pos": "QB",
        "team": "LAR",
        "udAdp": 104,
        "udPick": "9.8",
        "sleeperAdp": 110,
        "sleeperPick": "10.2"
    },
    {
        "id": "105",
        "name": "Xavier Worthy",
        "pos": "WR",
        "team": "KC",
        "udAdp": 105,
        "udPick": "9.9",
        "sleeperAdp": 129,
        "sleeperPick": "11.9"
    },
    {
        "id": "106",
        "name": "Jared Goff",
        "pos": "QB",
        "team": "DET",
        "udAdp": 106,
        "udPick": "9.10",
        "sleeperAdp": 125,
        "sleeperPick": "11.5"
    },
    {
        "id": "107",
        "name": "Michael Pittman Jr.",
        "pos": "WR",
        "team": "PIT",
        "udAdp": 107,
        "udPick": "9.11",
        "sleeperAdp": 113,
        "sleeperPick": "10.5"
    },
    {
        "id": "108",
        "name": "Kyler Murray",
        "pos": "QB",
        "team": "MIN",
        "udAdp": 108,
        "udPick": "9.12",
        "sleeperAdp": 147,
        "sleeperPick": "13.3"
    },
    {
        "id": "109",
        "name": "Matthew Golden",
        "pos": "WR",
        "team": "GB",
        "udAdp": 109,
        "udPick": "10.1",
        "sleeperAdp": 170,
        "sleeperPick": "15.2"
    },
    {
        "id": "110",
        "name": "Jordan Love",
        "pos": "QB",
        "team": "GB",
        "udAdp": 110,
        "udPick": "10.2",
        "sleeperAdp": 119,
        "sleeperPick": "10.11"
    },
    {
        "id": "111",
        "name": "Chris Rodriguez Jr.",
        "pos": "RB",
        "team": "JAC",
        "udAdp": 111,
        "udPick": "10.3",
        "sleeperAdp": 179,
        "sleeperPick": "15.11"
    },
    {
        "id": "112",
        "name": "Tyler Shough",
        "pos": "QB",
        "team": "NO",
        "udAdp": 112,
        "udPick": "10.4",
        "sleeperAdp": 141,
        "sleeperPick": "12.9"
    },
    {
        "id": "113",
        "name": "Romeo Doubs",
        "pos": "WR",
        "team": "NE",
        "udAdp": 113,
        "udPick": "10.5",
        "sleeperAdp": 123,
        "sleeperPick": "11.3"
    },
    {
        "id": "114",
        "name": "Jacory Croskey-Merritt",
        "pos": "RB",
        "team": "WAS",
        "udAdp": 114,
        "udPick": "10.6",
        "sleeperAdp": 127,
        "sleeperPick": "11.7"
    },
    {
        "id": "115",
        "name": "KC Concepcion",
        "pos": "WR",
        "team": "CLE",
        "udAdp": 115,
        "udPick": "10.7",
        "sleeperAdp": 139,
        "sleeperPick": "12.7"
    },
    {
        "id": "116",
        "name": "Baker Mayfield",
        "pos": "QB",
        "team": "TB",
        "udAdp": 116,
        "udPick": "10.8",
        "sleeperAdp": 136,
        "sleeperPick": "12.4"
    },
    {
        "id": "117",
        "name": "Kenneth Gainwell",
        "pos": "RB",
        "team": "TB",
        "udAdp": 117,
        "udPick": "10.9",
        "sleeperAdp": 118,
        "sleeperPick": "10.10"
    },
    {
        "id": "118",
        "name": "Wan'Dale Robinson",
        "pos": "WR",
        "team": "TEN",
        "udAdp": 118,
        "udPick": "10.10",
        "sleeperAdp": 111,
        "sleeperPick": "10.3"
    },
    {
        "id": "119",
        "name": "George Kittle",
        "pos": "TE",
        "team": "SF",
        "udAdp": 119,
        "udPick": "10.11",
        "sleeperAdp": 106,
        "sleeperPick": "9.10"
    },
    {
        "id": "120",
        "name": "Aaron Jones Sr.",
        "pos": "RB",
        "team": "MIN",
        "udAdp": 120,
        "udPick": "10.12",
        "sleeperAdp": 117,
        "sleeperPick": "10.9"
    },
    {
        "id": "121",
        "name": "Jonathon Brooks",
        "pos": "RB",
        "team": "CAR",
        "udAdp": 121,
        "udPick": "11.1",
        "sleeperAdp": 180,
        "sleeperPick": "15.12"
    },
    {
        "id": "122",
        "name": "Travis Kelce",
        "pos": "TE",
        "team": "KC",
        "udAdp": 122,
        "udPick": "11.2",
        "sleeperAdp": 112,
        "sleeperPick": "10.4"
    },
    {
        "id": "123",
        "name": "Jordan Mason",
        "pos": "RB",
        "team": "MIN",
        "udAdp": 123,
        "udPick": "11.3",
        "sleeperAdp": 144,
        "sleeperPick": "12.12"
    },
    {
        "id": "124",
        "name": "Rachaad White",
        "pos": "RB",
        "team": "WAS",
        "udAdp": 124,
        "udPick": "11.4",
        "sleeperAdp": 157,
        "sleeperPick": "14.1"
    },
    {
        "id": "125",
        "name": "Jayden Higgins",
        "pos": "WR",
        "team": "HOU",
        "udAdp": 125,
        "udPick": "11.5",
        "sleeperAdp": 135,
        "sleeperPick": "12.3"
    },
    {
        "id": "126",
        "name": "Jake Ferguson",
        "pos": "TE",
        "team": "DAL",
        "udAdp": 126,
        "udPick": "11.6",
        "sleeperAdp": 103,
        "sleeperPick": "9.7"
    },
    {
        "id": "127",
        "name": "Mark Andrews",
        "pos": "TE",
        "team": "BAL",
        "udAdp": 127,
        "udPick": "11.7",
        "sleeperAdp": 102,
        "sleeperPick": "9.6"
    },
    {
        "id": "128",
        "name": "Khalil Shakir",
        "pos": "WR",
        "team": "BUF",
        "udAdp": 128,
        "udPick": "11.8",
        "sleeperAdp": 128,
        "sleeperPick": "11.8"
    },
    {
        "id": "129",
        "name": "Tyrone Tracy Jr.",
        "pos": "RB",
        "team": "NYG",
        "udAdp": 129,
        "udPick": "11.9",
        "sleeperAdp": 143,
        "sleeperPick": "12.11"
    },
    {
        "id": "130",
        "name": "Dalton Kincaid",
        "pos": "TE",
        "team": "BUF",
        "udAdp": 130,
        "udPick": "11.10",
        "sleeperAdp": 84,
        "sleeperPick": "7.12"
    },
    {
        "id": "131",
        "name": "Malik Willis",
        "pos": "QB",
        "team": "MIA",
        "udAdp": 131,
        "udPick": "11.11",
        "sleeperAdp": 134,
        "sleeperPick": "12.2"
    },
    {
        "id": "132",
        "name": "Jalen Coker",
        "pos": "WR",
        "team": "CAR",
        "udAdp": 132,
        "udPick": "11.12",
        "sleeperAdp": 142,
        "sleeperPick": "12.10"
    },
    {
        "id": "133",
        "name": "Isaiah Likely",
        "pos": "TE",
        "team": "NYG",
        "udAdp": 133,
        "udPick": "12.1",
        "sleeperAdp": 120,
        "sleeperPick": "10.12"
    },
    {
        "id": "134",
        "name": "Dallas Goedert",
        "pos": "TE",
        "team": "PHI",
        "udAdp": 134,
        "udPick": "12.2",
        "sleeperAdp": 100,
        "sleeperPick": "9.4"
    },
    {
        "id": "135",
        "name": "Stefon Diggs",
        "pos": "WR",
        "team": "FA",
        "udAdp": 135,
        "udPick": "12.3",
        "sleeperAdp": 121,
        "sleeperPick": "11.1"
    },
    {
        "id": "136",
        "name": "Cam Ward",
        "pos": "QB",
        "team": "TEN",
        "udAdp": 136,
        "udPick": "12.4",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "137",
        "name": "Rashid Shaheed",
        "pos": "WR",
        "team": "SEA",
        "udAdp": 137,
        "udPick": "12.5",
        "sleeperAdp": 173,
        "sleeperPick": "15.5"
    },
    {
        "id": "138",
        "name": "Sam Darnold",
        "pos": "QB",
        "team": "SEA",
        "udAdp": 139,
        "udPick": "12.7",
        "sleeperAdp": 163,
        "sleeperPick": "14.7"
    },
    {
        "id": "139",
        "name": "Omar Cooper Jr.",
        "pos": "WR",
        "team": "NYJ",
        "udAdp": 140,
        "udPick": "12.8",
        "sleeperAdp": 164,
        "sleeperPick": "14.8"
    },
    {
        "id": "140",
        "name": "C.J. Stroud",
        "pos": "QB",
        "team": "HOU",
        "udAdp": 141,
        "udPick": "12.9",
        "sleeperAdp": 161,
        "sleeperPick": "14.5"
    },
    {
        "id": "141",
        "name": "Oronde Gadsden II",
        "pos": "TE",
        "team": "LAC",
        "udAdp": 142,
        "udPick": "12.10",
        "sleeperAdp": 89,
        "sleeperPick": "8.5"
    },
    {
        "id": "142",
        "name": "Jonah Coleman",
        "pos": "RB",
        "team": "DEN",
        "udAdp": 143,
        "udPick": "12.11",
        "sleeperAdp": 152,
        "sleeperPick": "13.8"
    },
    {
        "id": "143",
        "name": "Keaton Mitchell",
        "pos": "RB",
        "team": "LAC",
        "udAdp": 144,
        "udPick": "12.12",
        "sleeperAdp": 187,
        "sleeperPick": "16.7"
    },
    {
        "id": "144",
        "name": "Daniel Jones",
        "pos": "QB",
        "team": "IND",
        "udAdp": 145,
        "udPick": "13.1",
        "sleeperAdp": 194,
        "sleeperPick": "17.2"
    },
    {
        "id": "145",
        "name": "Woody Marks",
        "pos": "RB",
        "team": "HOU",
        "udAdp": 146,
        "udPick": "13.2",
        "sleeperAdp": 138,
        "sleeperPick": "12.6"
    },
    {
        "id": "146",
        "name": "Jalen McMillan",
        "pos": "WR",
        "team": "TB",
        "udAdp": 147,
        "udPick": "13.3",
        "sleeperAdp": 177,
        "sleeperPick": "15.9"
    },
    {
        "id": "147",
        "name": "Jauan Jennings",
        "pos": "WR",
        "team": "MIN",
        "udAdp": 148,
        "udPick": "13.4",
        "sleeperAdp": 130,
        "sleeperPick": "11.10"
    },
    {
        "id": "148",
        "name": "Kenyon Sadiq",
        "pos": "TE",
        "team": "NYJ",
        "udAdp": 149,
        "udPick": "13.5",
        "sleeperAdp": 114,
        "sleeperPick": "10.6"
    },
    {
        "id": "149",
        "name": "Isiah Pacheco",
        "pos": "RB",
        "team": "DET",
        "udAdp": 150,
        "udPick": "13.6",
        "sleeperAdp": 189,
        "sleeperPick": "16.9"
    },
    {
        "id": "150",
        "name": "Hunter Henry",
        "pos": "TE",
        "team": "NE",
        "udAdp": 151,
        "udPick": "13.7",
        "sleeperAdp": 99,
        "sleeperPick": "9.3"
    },
    {
        "id": "151",
        "name": "Chig Okonkwo",
        "pos": "TE",
        "team": "WAS",
        "udAdp": 152,
        "udPick": "13.8",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "152",
        "name": "Bryce Young",
        "pos": "QB",
        "team": "CAR",
        "udAdp": 153,
        "udPick": "13.9",
        "sleeperAdp": 192,
        "sleeperPick": "16.12"
    },
    {
        "id": "153",
        "name": "Brenton Strange",
        "pos": "TE",
        "team": "JAC",
        "udAdp": 154,
        "udPick": "13.10",
        "sleeperAdp": 109,
        "sleeperPick": "10.1"
    },
    {
        "id": "154",
        "name": "Jalen Nailor",
        "pos": "WR",
        "team": "LV",
        "udAdp": 155,
        "udPick": "13.11",
        "sleeperAdp": 222,
        "sleeperPick": "19.6"
    },
    {
        "id": "155",
        "name": "Juwan Johnson",
        "pos": "TE",
        "team": "NO",
        "udAdp": 156,
        "udPick": "13.12",
        "sleeperAdp": 108,
        "sleeperPick": "9.12"
    },
    {
        "id": "156",
        "name": "Tre Tucker",
        "pos": "WR",
        "team": "LV",
        "udAdp": 157,
        "udPick": "14.1",
        "sleeperAdp": 205,
        "sleeperPick": "18.1"
    },
    {
        "id": "157",
        "name": "Tyler Allgeier",
        "pos": "RB",
        "team": "ARI",
        "udAdp": 158,
        "udPick": "14.2",
        "sleeperAdp": 122,
        "sleeperPick": "11.2"
    },
    {
        "id": "158",
        "name": "Antonio Williams",
        "pos": "WR",
        "team": "WAS",
        "udAdp": 159,
        "udPick": "14.3",
        "sleeperAdp": 168,
        "sleeperPick": "14.12"
    },
    {
        "id": "159",
        "name": "Denzel Boston",
        "pos": "WR",
        "team": "CLE",
        "udAdp": 160,
        "udPick": "14.4",
        "sleeperAdp": 166,
        "sleeperPick": "14.10"
    },
    {
        "id": "160",
        "name": "Zach Charbonnet",
        "pos": "RB",
        "team": "SEA",
        "udAdp": 161,
        "udPick": "14.5",
        "sleeperAdp": 133,
        "sleeperPick": "12.1"
    },
    {
        "id": "161",
        "name": "Tyjae Spears",
        "pos": "RB",
        "team": "TEN",
        "udAdp": 162,
        "udPick": "14.6",
        "sleeperAdp": 156,
        "sleeperPick": "13.12"
    },
    {
        "id": "162",
        "name": "T.J. Hockenson",
        "pos": "TE",
        "team": "MIN",
        "udAdp": 163,
        "udPick": "14.7",
        "sleeperAdp": 137,
        "sleeperPick": "12.5"
    },
    {
        "id": "163",
        "name": "De'Zhaun Stribling",
        "pos": "WR",
        "team": "SF",
        "udAdp": 164,
        "udPick": "14.8",
        "sleeperAdp": 245,
        "sleeperPick": "21.5"
    },
    {
        "id": "164",
        "name": "Brian Robinson Jr.",
        "pos": "RB",
        "team": "ATL",
        "udAdp": 165,
        "udPick": "14.9",
        "sleeperAdp": 107,
        "sleeperPick": "9.11"
    },
    {
        "id": "165",
        "name": "Deebo Samuel Sr.",
        "pos": "WR",
        "team": "FA",
        "udAdp": 166,
        "udPick": "14.10",
        "sleeperAdp": 162,
        "sleeperPick": "14.6"
    },
    {
        "id": "166",
        "name": "Fernando Mendoza",
        "pos": "QB",
        "team": "LV",
        "udAdp": 167,
        "udPick": "14.11",
        "sleeperAdp": 183,
        "sleeperPick": "16.3"
    },
    {
        "id": "167",
        "name": "Dylan Sampson",
        "pos": "RB",
        "team": "CLE",
        "udAdp": 168,
        "udPick": "14.12",
        "sleeperAdp": 165,
        "sleeperPick": "14.9"
    },
    {
        "id": "168",
        "name": "Isaac TeSlaa",
        "pos": "WR",
        "team": "DET",
        "udAdp": 169,
        "udPick": "15.1",
        "sleeperAdp": 198,
        "sleeperPick": "17.6"
    },
    {
        "id": "169",
        "name": "AJ Barner",
        "pos": "TE",
        "team": "SEA",
        "udAdp": 170,
        "udPick": "15.2",
        "sleeperAdp": 131,
        "sleeperPick": "11.11"
    },
    {
        "id": "170",
        "name": "Aaron Rodgers",
        "pos": "QB",
        "team": "PIT",
        "udAdp": 171,
        "udPick": "15.3",
        "sleeperAdp": 288,
        "sleeperPick": "24.12"
    },
    {
        "id": "171",
        "name": "Dalton Schultz",
        "pos": "TE",
        "team": "HOU",
        "udAdp": 172,
        "udPick": "15.4",
        "sleeperAdp": 104,
        "sleeperPick": "9.8"
    },
    {
        "id": "172",
        "name": "Tank Bigsby",
        "pos": "RB",
        "team": "PHI",
        "udAdp": 173,
        "udPick": "15.5",
        "sleeperAdp": 184,
        "sleeperPick": "16.4"
    },
    {
        "id": "173",
        "name": "Nicholas Singleton",
        "pos": "RB",
        "team": "TEN",
        "udAdp": 174,
        "udPick": "15.6",
        "sleeperAdp": 207,
        "sleeperPick": "18.3"
    },
    {
        "id": "174",
        "name": "Ryan Flournoy",
        "pos": "WR",
        "team": "DAL",
        "udAdp": 175,
        "udPick": "15.7",
        "sleeperAdp": 224,
        "sleeperPick": "19.8"
    },
    {
        "id": "175",
        "name": "Brandon Aiyuk",
        "pos": "WR",
        "team": "SF",
        "udAdp": 176,
        "udPick": "15.8",
        "sleeperAdp": 188,
        "sleeperPick": "16.8"
    },
    {
        "id": "176",
        "name": "Geno Smith",
        "pos": "QB",
        "team": "NYJ",
        "udAdp": 177,
        "udPick": "15.9",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "177",
        "name": "Gunnar Helm",
        "pos": "TE",
        "team": "TEN",
        "udAdp": 178,
        "udPick": "15.10",
        "sleeperAdp": 167,
        "sleeperPick": "14.11"
    },
    {
        "id": "178",
        "name": "Calvin Ridley",
        "pos": "WR",
        "team": "TEN",
        "udAdp": 179,
        "udPick": "15.11",
        "sleeperAdp": 195,
        "sleeperPick": "17.3"
    },
    {
        "id": "179",
        "name": "Germie Bernard",
        "pos": "WR",
        "team": "PIT",
        "udAdp": 180,
        "udPick": "15.12",
        "sleeperAdp": 215,
        "sleeperPick": "18.11"
    },
    {
        "id": "180",
        "name": "Emmett Johnson",
        "pos": "RB",
        "team": "KC",
        "udAdp": 181,
        "udPick": "16.1",
        "sleeperAdp": 146,
        "sleeperPick": "13.2"
    },
    {
        "id": "181",
        "name": "Ted Hurst III",
        "pos": "WR",
        "team": "TB",
        "udAdp": 182,
        "udPick": "16.2",
        "sleeperAdp": 218,
        "sleeperPick": "19.2"
    },
    {
        "id": "182",
        "name": "Jerry Jeudy",
        "pos": "WR",
        "team": "CLE",
        "udAdp": 183,
        "udPick": "16.3",
        "sleeperAdp": 171,
        "sleeperPick": "15.3"
    },
    {
        "id": "183",
        "name": "Cade Otton",
        "pos": "TE",
        "team": "TB",
        "udAdp": 184,
        "udPick": "16.4",
        "sleeperAdp": 160,
        "sleeperPick": "14.4"
    },
    {
        "id": "184",
        "name": "Alvin Kamara",
        "pos": "RB",
        "team": "NO",
        "udAdp": 185,
        "udPick": "16.5",
        "sleeperAdp": 154,
        "sleeperPick": "13.10"
    },
    {
        "id": "185",
        "name": "Pat Freiermuth",
        "pos": "TE",
        "team": "PIT",
        "udAdp": 186,
        "udPick": "16.6",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "186",
        "name": "Tre' Harris",
        "pos": "WR",
        "team": "LAC",
        "udAdp": 187,
        "udPick": "16.7",
        "sleeperAdp": 193,
        "sleeperPick": "17.1"
    },
    {
        "id": "187",
        "name": "Jacoby Brissett",
        "pos": "QB",
        "team": "ARI",
        "udAdp": 188,
        "udPick": "16.8",
        "sleeperAdp": 200,
        "sleeperPick": "17.8"
    },
    {
        "id": "188",
        "name": "Mike Washington Jr.",
        "pos": "RB",
        "team": "LV",
        "udAdp": 189,
        "udPick": "16.9",
        "sleeperAdp": 176,
        "sleeperPick": "15.8"
    },
    {
        "id": "189",
        "name": "Darnell Mooney",
        "pos": "WR",
        "team": "NYG",
        "udAdp": 190,
        "udPick": "16.10",
        "sleeperAdp": 216,
        "sleeperPick": "18.12"
    },
    {
        "id": "190",
        "name": "Chris Bell",
        "pos": "WR",
        "team": "MIA",
        "udAdp": 191,
        "udPick": "16.11",
        "sleeperAdp": 229,
        "sleeperPick": "20.1"
    },
    {
        "id": "191",
        "name": "Emanuel Wilson",
        "pos": "RB",
        "team": "SEA",
        "udAdp": 192,
        "udPick": "16.12",
        "sleeperAdp": 201,
        "sleeperPick": "17.9"
    },
    {
        "id": "192",
        "name": "Kaytron Allen",
        "pos": "RB",
        "team": "WAS",
        "udAdp": 193,
        "udPick": "17.1",
        "sleeperAdp": 196,
        "sleeperPick": "17.4"
    },
    {
        "id": "193",
        "name": "David Njoku",
        "pos": "TE",
        "team": "LAC",
        "udAdp": 194,
        "udPick": "17.2",
        "sleeperAdp": 140,
        "sleeperPick": "12.8"
    },
    {
        "id": "194",
        "name": "Sean Tucker",
        "pos": "RB",
        "team": "TB",
        "udAdp": 195,
        "udPick": "17.3",
        "sleeperAdp": 191,
        "sleeperPick": "16.11"
    },
    {
        "id": "195",
        "name": "Tank Dell",
        "pos": "WR",
        "team": "HOU",
        "udAdp": 196,
        "udPick": "17.4",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "196",
        "name": "Zachariah Branch",
        "pos": "WR",
        "team": "ATL",
        "udAdp": 197,
        "udPick": "17.5",
        "sleeperAdp": 203,
        "sleeperPick": "17.11"
    },
    {
        "id": "197",
        "name": "Eli Stowers",
        "pos": "TE",
        "team": "PHI",
        "udAdp": 198,
        "udPick": "17.6",
        "sleeperAdp": 153,
        "sleeperPick": "13.9"
    },
    {
        "id": "198",
        "name": "Ray Davis",
        "pos": "RB",
        "team": "BUF",
        "udAdp": 199,
        "udPick": "17.7",
        "sleeperAdp": 206,
        "sleeperPick": "18.2"
    },
    {
        "id": "199",
        "name": "Braelon Allen",
        "pos": "RB",
        "team": "NYJ",
        "udAdp": 200,
        "udPick": "17.8",
        "sleeperAdp": 172,
        "sleeperPick": "15.4"
    },
    {
        "id": "200",
        "name": "Terrance Ferguson",
        "pos": "TE",
        "team": "LAR",
        "udAdp": 201,
        "udPick": "17.9",
        "sleeperAdp": 155,
        "sleeperPick": "13.11"
    },
    {
        "id": "201",
        "name": "Malik Washington",
        "pos": "WR",
        "team": "MIA",
        "udAdp": 202,
        "udPick": "17.10",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "202",
        "name": "Tyreek Hill",
        "pos": "WR",
        "team": "FA",
        "udAdp": 203,
        "udPick": "17.11",
        "sleeperAdp": 159,
        "sleeperPick": "14.3"
    },
    {
        "id": "203",
        "name": "Malachi Fields",
        "pos": "WR",
        "team": "NYG",
        "udAdp": 204,
        "udPick": "17.12",
        "sleeperAdp": 242,
        "sleeperPick": "21.2"
    },
    {
        "id": "204",
        "name": "Kayshon Boutte",
        "pos": "WR",
        "team": "NE",
        "udAdp": 205,
        "udPick": "18.1",
        "sleeperAdp": 175,
        "sleeperPick": "15.7"
    },
    {
        "id": "205",
        "name": "Mike Gesicki",
        "pos": "TE",
        "team": "CIN",
        "udAdp": 206,
        "udPick": "18.2",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "206",
        "name": "Cooper Kupp",
        "pos": "WR",
        "team": "SEA",
        "udAdp": 207,
        "udPick": "18.3",
        "sleeperAdp": 233,
        "sleeperPick": "20.5"
    },
    {
        "id": "207",
        "name": "Tua Tagovailoa",
        "pos": "QB",
        "team": "ATL",
        "udAdp": 208,
        "udPick": "18.4",
        "sleeperAdp": 234,
        "sleeperPick": "20.6"
    },
    {
        "id": "208",
        "name": "Greg Dulcich",
        "pos": "TE",
        "team": "MIA",
        "udAdp": 209,
        "udPick": "18.5",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "209",
        "name": "Dontayvion Wicks",
        "pos": "WR",
        "team": "PHI",
        "udAdp": 210,
        "udPick": "18.6",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "210",
        "name": "Kaelon Black",
        "pos": "RB",
        "team": "SF",
        "udAdp": 211,
        "udPick": "18.7",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "211",
        "name": "Adonai Mitchell",
        "pos": "WR",
        "team": "NYJ",
        "udAdp": 212,
        "udPick": "18.8",
        "sleeperAdp": 174,
        "sleeperPick": "15.6"
    },
    {
        "id": "212",
        "name": "Jordan James",
        "pos": "RB",
        "team": "SF",
        "udAdp": 213,
        "udPick": "18.9",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "213",
        "name": "Deshaun Watson",
        "pos": "QB",
        "team": "CLE",
        "udAdp": 214,
        "udPick": "18.10",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "214",
        "name": "Elijah Sarratt",
        "pos": "WR",
        "team": "BAL",
        "udAdp": 215,
        "udPick": "18.11",
        "sleeperAdp": 227,
        "sleeperPick": "19.11"
    },
    {
        "id": "215",
        "name": "Troy Franklin",
        "pos": "WR",
        "team": "DEN",
        "udAdp": 216,
        "udPick": "18.12",
        "sleeperAdp": 181,
        "sleeperPick": "16.1"
    },
    {
        "id": "216",
        "name": "Kimani Vidal",
        "pos": "RB",
        "team": "LAC",
        "udAdp": 217,
        "udPick": "19.1",
        "sleeperAdp": 178,
        "sleeperPick": "15.10"
    },
    {
        "id": "217",
        "name": "Tory Horton",
        "pos": "WR",
        "team": "SEA",
        "udAdp": 218,
        "udPick": "19.2",
        "sleeperAdp": 226,
        "sleeperPick": "19.10"
    },
    {
        "id": "218",
        "name": "Jake Tonges",
        "pos": "TE",
        "team": "SF",
        "udAdp": 219,
        "udPick": "19.3",
        "sleeperAdp": 190,
        "sleeperPick": "16.10"
    },
    {
        "id": "219",
        "name": "Chris Brazzell II",
        "pos": "WR",
        "team": "CAR",
        "udAdp": 220,
        "udPick": "19.4",
        "sleeperAdp": 228,
        "sleeperPick": "19.12"
    },
    {
        "id": "220",
        "name": "Pat Bryant",
        "pos": "WR",
        "team": "DEN",
        "udAdp": 221,
        "udPick": "19.5",
        "sleeperAdp": 182,
        "sleeperPick": "16.2"
    },
    {
        "id": "221",
        "name": "Keon Coleman",
        "pos": "WR",
        "team": "BUF",
        "udAdp": 222,
        "udPick": "19.6",
        "sleeperAdp": 232,
        "sleeperPick": "20.4"
    },
    {
        "id": "222",
        "name": "Michael Penix Jr.",
        "pos": "QB",
        "team": "ATL",
        "udAdp": 223,
        "udPick": "19.7",
        "sleeperAdp": 225,
        "sleeperPick": "19.9"
    },
    {
        "id": "223",
        "name": "Justice Hill",
        "pos": "RB",
        "team": "BAL",
        "udAdp": 224,
        "udPick": "19.8",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "224",
        "name": "Colby Parkinson",
        "pos": "TE",
        "team": "LAR",
        "udAdp": 225,
        "udPick": "19.9",
        "sleeperAdp": 148,
        "sleeperPick": "13.4"
    },
    {
        "id": "225",
        "name": "Demond Claiborne",
        "pos": "RB",
        "team": "MIN",
        "udAdp": 226,
        "udPick": "19.10",
        "sleeperAdp": 213,
        "sleeperPick": "18.9"
    },
    {
        "id": "226",
        "name": "Rashod Bateman",
        "pos": "WR",
        "team": "BAL",
        "udAdp": 227,
        "udPick": "19.11",
        "sleeperAdp": 230,
        "sleeperPick": "20.2"
    },
    {
        "id": "227",
        "name": "Christian Kirk",
        "pos": "WR",
        "team": "SF",
        "udAdp": 228,
        "udPick": "19.12",
        "sleeperAdp": 240,
        "sleeperPick": "20.12"
    },
    {
        "id": "228",
        "name": "Tyquan Thornton",
        "pos": "WR",
        "team": "KC",
        "udAdp": 229,
        "udPick": "20.1",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "229",
        "name": "James Conner",
        "pos": "RB",
        "team": "ARI",
        "udAdp": 230,
        "udPick": "20.2",
        "sleeperAdp": 124,
        "sleeperPick": "11.4"
    },
    {
        "id": "230",
        "name": "Jaylin Noel",
        "pos": "WR",
        "team": "HOU",
        "udAdp": 231,
        "udPick": "20.3",
        "sleeperAdp": 210,
        "sleeperPick": "18.6"
    },
    {
        "id": "231",
        "name": "Skyler Bell",
        "pos": "WR",
        "team": "BUF",
        "udAdp": 232,
        "udPick": "20.4",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "232",
        "name": "Ja'Kobi Lane",
        "pos": "WR",
        "team": "BAL",
        "udAdp": 233,
        "udPick": "20.5",
        "sleeperAdp": 197,
        "sleeperPick": "17.5"
    },
    {
        "id": "233",
        "name": "Evan Engram",
        "pos": "TE",
        "team": "DEN",
        "udAdp": 234,
        "udPick": "20.6",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "234",
        "name": "Shedeur Sanders",
        "pos": "QB",
        "team": "CLE",
        "udAdp": 235,
        "udPick": "20.7",
        "sleeperAdp": 221,
        "sleeperPick": "19.5"
    },
    {
        "id": "235",
        "name": "Jaydon Blue",
        "pos": "RB",
        "team": "DAL",
        "udAdp": 236,
        "udPick": "20.8",
        "sleeperAdp": 235,
        "sleeperPick": "20.7"
    },
    {
        "id": "236",
        "name": "Jack Bech",
        "pos": "WR",
        "team": "LV",
        "udAdp": 237,
        "udPick": "20.9",
        "sleeperAdp": 237,
        "sleeperPick": "20.9"
    },
    {
        "id": "237",
        "name": "Kirk Cousins",
        "pos": "QB",
        "team": "LV",
        "udAdp": 238,
        "udPick": "20.10",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "238",
        "name": "Carson Beck",
        "pos": "QB",
        "team": "ARI",
        "udAdp": 239,
        "udPick": "20.11",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "239",
        "name": "Samaje Perine",
        "pos": "RB",
        "team": "CIN",
        "udAdp": 240,
        "udPick": "20.12",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "240",
        "name": "Michael Mayer",
        "pos": "TE",
        "team": "LV",
        "udAdp": 241,
        "udPick": "21.1",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "241",
        "name": "Andrei Iosivas",
        "pos": "WR",
        "team": "CIN",
        "udAdp": 242,
        "udPick": "21.2",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "242",
        "name": "Adam Randall",
        "pos": "RB",
        "team": "BAL",
        "udAdp": 243,
        "udPick": "21.3",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "243",
        "name": "Caleb Douglas",
        "pos": "WR",
        "team": "MIA",
        "udAdp": 244,
        "udPick": "21.4",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "244",
        "name": "MarShawn Lloyd",
        "pos": "RB",
        "team": "GB",
        "udAdp": 245,
        "udPick": "21.5",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "245",
        "name": "Theo Johnson",
        "pos": "TE",
        "team": "NYG",
        "udAdp": 246,
        "udPick": "21.6",
        "sleeperAdp": 158,
        "sleeperPick": "14.2"
    },
    {
        "id": "246",
        "name": "Malik Davis",
        "pos": "RB",
        "team": "DAL",
        "udAdp": 247,
        "udPick": "21.7",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "247",
        "name": "Keenan Allen",
        "pos": "WR",
        "team": "LAC",
        "udAdp": 248,
        "udPick": "21.8",
        "sleeperAdp": 231,
        "sleeperPick": "20.3"
    },
    {
        "id": "248",
        "name": "Darius Slayton",
        "pos": "WR",
        "team": "NYG",
        "udAdp": 249,
        "udPick": "21.9",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "249",
        "name": "Devaughn Vele",
        "pos": "WR",
        "team": "NO",
        "udAdp": 250,
        "udPick": "21.10",
        "sleeperAdp": 238,
        "sleeperPick": "20.10"
    },
    {
        "id": "250",
        "name": "Darnell Washington",
        "pos": "TE",
        "team": "PIT",
        "udAdp": 251,
        "udPick": "21.11",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "251",
        "name": "DJ Giddens",
        "pos": "RB",
        "team": "IND",
        "udAdp": 252,
        "udPick": "21.12",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "252",
        "name": "Chimere Dike",
        "pos": "WR",
        "team": "TEN",
        "udAdp": 253,
        "udPick": "22.1",
        "sleeperAdp": 186,
        "sleeperPick": "16.6"
    },
    {
        "id": "253",
        "name": "Brenen Thompson",
        "pos": "WR",
        "team": "LAC",
        "udAdp": 254,
        "udPick": "22.2",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "254",
        "name": "Kyle Williams",
        "pos": "WR",
        "team": "NE",
        "udAdp": 255,
        "udPick": "22.3",
        "sleeperAdp": 217,
        "sleeperPick": "19.1"
    },
    {
        "id": "255",
        "name": "Ja'Tavion Sanders",
        "pos": "TE",
        "team": "CAR",
        "udAdp": 256,
        "udPick": "22.4",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "256",
        "name": "Ollie Gordon II",
        "pos": "RB",
        "team": "MIA",
        "udAdp": 257,
        "udPick": "22.5",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "257",
        "name": "Zavion Thomas",
        "pos": "WR",
        "team": "CHI",
        "udAdp": 258,
        "udPick": "22.6",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "258",
        "name": "Oscar Delp",
        "pos": "TE",
        "team": "NO",
        "udAdp": 259,
        "udPick": "22.7",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "259",
        "name": "Dawson Knox",
        "pos": "TE",
        "team": "BUF",
        "udAdp": 260,
        "udPick": "22.8",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "260",
        "name": "Eli Raridon",
        "pos": "TE",
        "team": "NE",
        "udAdp": 261,
        "udPick": "22.9",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "261",
        "name": "J.J. McCarthy",
        "pos": "QB",
        "team": "MIN",
        "udAdp": 262,
        "udPick": "22.10",
        "sleeperAdp": 219,
        "sleeperPick": "19.3"
    },
    {
        "id": "262",
        "name": "Jaylen Wright",
        "pos": "RB",
        "team": "MIA",
        "udAdp": 263,
        "udPick": "22.11",
        "sleeperAdp": 211,
        "sleeperPick": "18.7"
    },
    {
        "id": "263",
        "name": "Chris Brooks",
        "pos": "RB",
        "team": "GB",
        "udAdp": 264,
        "udPick": "22.12",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "264",
        "name": "Bryce Lance",
        "pos": "WR",
        "team": "NO",
        "udAdp": 265,
        "udPick": "23.1",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "265",
        "name": "Jalen Tolbert",
        "pos": "WR",
        "team": "MIA",
        "udAdp": 266,
        "udPick": "23.2",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "266",
        "name": "Elic Ayomanor",
        "pos": "WR",
        "team": "TEN",
        "udAdp": 267,
        "udPick": "23.3",
        "sleeperAdp": 199,
        "sleeperPick": "17.7"
    },
    {
        "id": "267",
        "name": "Najee Harris",
        "pos": "RB",
        "team": "LAC",
        "udAdp": 268,
        "udPick": "23.4",
        "sleeperAdp": 209,
        "sleeperPick": "18.5"
    },
    {
        "id": "268",
        "name": "Eli Heidenreich",
        "pos": "RB",
        "team": "PIT",
        "udAdp": 269,
        "udPick": "23.5",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "269",
        "name": "KaVontae Turpin",
        "pos": "WR",
        "team": "DAL",
        "udAdp": 270,
        "udPick": "23.6",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "270",
        "name": "Ty Johnson",
        "pos": "RB",
        "team": "BUF",
        "udAdp": 271,
        "udPick": "23.7",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "271",
        "name": "DeMario Douglas",
        "pos": "WR",
        "team": "NE",
        "udAdp": 272,
        "udPick": "23.8",
        "sleeperAdp": 297,
        "sleeperPick": "25.9"
    },
    {
        "id": "272",
        "name": "Justin Joly",
        "pos": "TE",
        "team": "DEN",
        "udAdp": 273,
        "udPick": "23.9",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "273",
        "name": "Dont'e Thornton Jr.",
        "pos": "WR",
        "team": "LV",
        "udAdp": 274,
        "udPick": "23.10",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "274",
        "name": "Tahj Brooks",
        "pos": "RB",
        "team": "CIN",
        "udAdp": 275,
        "udPick": "23.11",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "275",
        "name": "Mason Taylor",
        "pos": "TE",
        "team": "NYJ",
        "udAdp": 276,
        "udPick": "23.12",
        "sleeperAdp": 151,
        "sleeperPick": "13.7"
    },
    {
        "id": "276",
        "name": "Elijah Arroyo",
        "pos": "TE",
        "team": "SEA",
        "udAdp": 277,
        "udPick": "24.1",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "277",
        "name": "Jahan Dotson",
        "pos": "WR",
        "team": "ATL",
        "udAdp": 278,
        "udPick": "24.2",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "278",
        "name": "Justin Fields",
        "pos": "QB",
        "team": "KC",
        "udAdp": 279,
        "udPick": "24.3",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "279",
        "name": "Tez Johnson",
        "pos": "WR",
        "team": "TB",
        "udAdp": 280,
        "udPick": "24.4",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "280",
        "name": "Treylon Burks",
        "pos": "WR",
        "team": "WAS",
        "udAdp": 281,
        "udPick": "24.5",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "281",
        "name": "Jahdae Walker",
        "pos": "WR",
        "team": "CHI",
        "udAdp": 282,
        "udPick": "24.6",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "282",
        "name": "Cole Kmet",
        "pos": "TE",
        "team": "CHI",
        "udAdp": 283,
        "udPick": "24.7",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "283",
        "name": "Devin Neal",
        "pos": "RB",
        "team": "NO",
        "udAdp": 284,
        "udPick": "24.8",
        "sleeperAdp": 208,
        "sleeperPick": "18.4"
    },
    {
        "id": "284",
        "name": "George Holani",
        "pos": "RB",
        "team": "SEA",
        "udAdp": 285,
        "udPick": "24.9",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "285",
        "name": "Savion Williams",
        "pos": "WR",
        "team": "GB",
        "udAdp": 286,
        "udPick": "24.10",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "286",
        "name": "Kevin Coleman Jr.",
        "pos": "WR",
        "team": "MIA",
        "udAdp": 287,
        "udPick": "24.11",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "287",
        "name": "Kendrick Bourne",
        "pos": "WR",
        "team": "ARI",
        "udAdp": 288,
        "udPick": "24.12",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "288",
        "name": "Hollywood Brown",
        "pos": "WR",
        "team": "PHI",
        "udAdp": 289,
        "udPick": "25.1",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "289",
        "name": "LeQuint Allen Jr.",
        "pos": "RB",
        "team": "JAC",
        "udAdp": 290,
        "udPick": "25.2",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "290",
        "name": "Xavier Legette",
        "pos": "WR",
        "team": "CAR",
        "udAdp": 291,
        "udPick": "25.3",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "291",
        "name": "Cyrus Allen",
        "pos": "WR",
        "team": "KC",
        "udAdp": 292,
        "udPick": "25.4",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "292",
        "name": "Kaleb Johnson",
        "pos": "RB",
        "team": "PIT",
        "udAdp": 293,
        "udPick": "25.5",
        "sleeperAdp": 212,
        "sleeperPick": "18.8"
    },
    {
        "id": "293",
        "name": "Max Klare",
        "pos": "TE",
        "team": "LAR",
        "udAdp": 294,
        "udPick": "25.6",
        "sleeperAdp": 243,
        "sleeperPick": "21.3"
    },
    {
        "id": "294",
        "name": "Jalen Royals",
        "pos": "WR",
        "team": "KC",
        "udAdp": 295,
        "udPick": "25.7",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "295",
        "name": "Deion Burks",
        "pos": "WR",
        "team": "IND",
        "udAdp": 296,
        "udPick": "25.8",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "296",
        "name": "Mack Hollins",
        "pos": "WR",
        "team": "NE",
        "udAdp": 297,
        "udPick": "25.9",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "297",
        "name": "Jaylin Lane",
        "pos": "WR",
        "team": "WAS",
        "udAdp": 298,
        "udPick": "25.10",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "298",
        "name": "Tutu Atwell",
        "pos": "WR",
        "team": "MIA",
        "udAdp": 299,
        "udPick": "25.11",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "299",
        "name": "Mitch Tinsley",
        "pos": "WR",
        "team": "CIN",
        "udAdp": 300,
        "udPick": "25.12",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "300",
        "name": "Kalif Raymond",
        "pos": "WR",
        "team": "CHI",
        "udAdp": 301,
        "udPick": "26.1",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "301",
        "name": "Marvin Mims Jr.",
        "pos": "WR",
        "team": "DEN",
        "udAdp": 302,
        "udPick": "26.2",
        "sleeperAdp": 214,
        "sleeperPick": "18.10"
    },
    {
        "id": "302",
        "name": "Isaiah Bond",
        "pos": "WR",
        "team": "CLE",
        "udAdp": 303,
        "udPick": "26.3",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "303",
        "name": "Joshua Palmer",
        "pos": "WR",
        "team": "BUF",
        "udAdp": 304,
        "udPick": "26.4",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "304",
        "name": "Jameis Winston",
        "pos": "QB",
        "team": "NYG",
        "udAdp": 305,
        "udPick": "26.5",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "305",
        "name": "Harrison Bryant",
        "pos": "TE",
        "team": "SEA",
        "udAdp": 306,
        "udPick": "26.6",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "306",
        "name": "Calvin Austin III",
        "pos": "WR",
        "team": "NYG",
        "udAdp": 307,
        "udPick": "26.7",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "307",
        "name": "Mac Jones",
        "pos": "QB",
        "team": "SF",
        "udAdp": 308,
        "udPick": "26.8",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "308",
        "name": "Cade Klubnik",
        "pos": "QB",
        "team": "NYJ",
        "udAdp": 309,
        "udPick": "26.9",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "309",
        "name": "Jordan Whittington",
        "pos": "WR",
        "team": "LAR",
        "udAdp": 310,
        "udPick": "26.10",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "310",
        "name": "Brashard Smith",
        "pos": "RB",
        "team": "KC",
        "udAdp": 311,
        "udPick": "26.11",
        "sleeperAdp": 223,
        "sleeperPick": "19.7"
    },
    {
        "id": "311",
        "name": "Dyami Brown",
        "pos": "WR",
        "team": "WAS",
        "udAdp": 312,
        "udPick": "26.12",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "312",
        "name": "Joe Mixon",
        "pos": "RB",
        "team": "FA",
        "udAdp": 313,
        "udPick": "27.1",
        "sleeperAdp": 202,
        "sleeperPick": "17.10"
    },
    {
        "id": "313",
        "name": "Taylen Green",
        "pos": "QB",
        "team": "CLE",
        "udAdp": 314,
        "udPick": "27.2",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "314",
        "name": "Noah Gray",
        "pos": "TE",
        "team": "KC",
        "udAdp": 315,
        "udPick": "27.3",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "315",
        "name": "Anthony Richardson Sr.",
        "pos": "QB",
        "team": "IND",
        "udAdp": 316,
        "udPick": "27.4",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "316",
        "name": "Konata Mumpfield",
        "pos": "WR",
        "team": "LAR",
        "udAdp": 317,
        "udPick": "27.5",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "317",
        "name": "Seth McGowan",
        "pos": "RB",
        "team": "IND",
        "udAdp": 318,
        "udPick": "27.6",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "318",
        "name": "Joe Flacco",
        "pos": "QB",
        "team": "CIN",
        "udAdp": 319,
        "udPick": "27.7",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "319",
        "name": "Michael Trigg",
        "pos": "TE",
        "team": "DAL",
        "udAdp": 320,
        "udPick": "27.8",
        "sleeperAdp": 244,
        "sleeperPick": "21.4"
    },
    {
        "id": "320",
        "name": "Colbie Young",
        "pos": "WR",
        "team": "CIN",
        "udAdp": 321,
        "udPick": "27.9",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "321",
        "name": "Jam Miller",
        "pos": "RB",
        "team": "NE",
        "udAdp": 322,
        "udPick": "27.10",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "322",
        "name": "Luke McCaffrey",
        "pos": "WR",
        "team": "WAS",
        "udAdp": 323,
        "udPick": "27.11",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "323",
        "name": "Erick All Jr.",
        "pos": "TE",
        "team": "CIN",
        "udAdp": 324,
        "udPick": "27.12",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "324",
        "name": "Frank Gore Jr.",
        "pos": "RB",
        "team": "BUF",
        "udAdp": 325,
        "udPick": "28.1",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "325",
        "name": "Malik Benson",
        "pos": "WR",
        "team": "LV",
        "udAdp": 326,
        "udPick": "28.2",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "326",
        "name": "Isaiah Davis",
        "pos": "RB",
        "team": "NYJ",
        "udAdp": 327,
        "udPick": "28.3",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "327",
        "name": "CJ Daniels",
        "pos": "WR",
        "team": "LAR",
        "udAdp": 328,
        "udPick": "28.4",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "328",
        "name": "Xavier Hutchinson",
        "pos": "WR",
        "team": "HOU",
        "udAdp": 329,
        "udPick": "28.5",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "329",
        "name": "Trevor Etienne",
        "pos": "RB",
        "team": "CAR",
        "udAdp": 330,
        "udPick": "28.6",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "330",
        "name": "Emari Demercado",
        "pos": "RB",
        "team": "KC",
        "udAdp": 331,
        "udPick": "28.7",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "331",
        "name": "Mitchell Evans",
        "pos": "TE",
        "team": "CAR",
        "udAdp": 332,
        "udPick": "28.8",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "332",
        "name": "Marlin Klein",
        "pos": "TE",
        "team": "HOU",
        "udAdp": 333,
        "udPick": "28.9",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "333",
        "name": "Nick Westbrook-Ikhine",
        "pos": "WR",
        "team": "IND",
        "udAdp": 334,
        "udPick": "28.10",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "334",
        "name": "Devontez Walker",
        "pos": "WR",
        "team": "BAL",
        "udAdp": 335,
        "udPick": "28.11",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "335",
        "name": "Riley Leonard",
        "pos": "QB",
        "team": "IND",
        "udAdp": 336,
        "udPick": "28.12",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "336",
        "name": "Ja'Lynn Polk",
        "pos": "WR",
        "team": "NO",
        "udAdp": 337,
        "udPick": "29.1",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "337",
        "name": "Olamide Zaccheaus",
        "pos": "WR",
        "team": "ATL",
        "udAdp": 338,
        "udPick": "29.2",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "338",
        "name": "Theo Wease Jr.",
        "pos": "WR",
        "team": "MIA",
        "udAdp": 339,
        "udPick": "29.3",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "339",
        "name": "Jerome Ford",
        "pos": "RB",
        "team": "WAS",
        "udAdp": 340,
        "udPick": "29.4",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "340",
        "name": "Elijah Higgins",
        "pos": "TE",
        "team": "ARI",
        "udAdp": 341,
        "udPick": "29.5",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "341",
        "name": "Luke Musgrave",
        "pos": "TE",
        "team": "GB",
        "udAdp": 342,
        "udPick": "29.6",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "342",
        "name": "Daniel Bellinger",
        "pos": "TE",
        "team": "TEN",
        "udAdp": 343,
        "udPick": "29.7",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "343",
        "name": "Charlie Kolar",
        "pos": "TE",
        "team": "LAC",
        "udAdp": 344,
        "udPick": "29.8",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "344",
        "name": "Gardner Minshew II",
        "pos": "QB",
        "team": "ARI",
        "udAdp": 345,
        "udPick": "29.9",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "345",
        "name": "Trey Benson",
        "pos": "RB",
        "team": "ARI",
        "udAdp": 346,
        "udPick": "29.10",
        "sleeperAdp": 149,
        "sleeperPick": "13.5"
    },
    {
        "id": "346",
        "name": "Tanner Koziol",
        "pos": "TE",
        "team": "JAC",
        "udAdp": 347,
        "udPick": "29.11",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "347",
        "name": "Jackson Hawes",
        "pos": "TE",
        "team": "BUF",
        "udAdp": 348,
        "udPick": "29.12",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "348",
        "name": "Tommy Tremble",
        "pos": "TE",
        "team": "CAR",
        "udAdp": 349,
        "udPick": "30.1",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "349",
        "name": "Matt Hibner",
        "pos": "TE",
        "team": "BAL",
        "udAdp": 350,
        "udPick": "30.2",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "350",
        "name": "Efton Chism III",
        "pos": "WR",
        "team": "NE",
        "udAdp": 351,
        "udPick": "30.3",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "351",
        "name": "Tai Felton",
        "pos": "WR",
        "team": "MIN",
        "udAdp": 352,
        "udPick": "30.4",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "352",
        "name": "Greg Dortch",
        "pos": "WR",
        "team": "DET",
        "udAdp": 353,
        "udPick": "30.5",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "353",
        "name": "Jalen Milroe",
        "pos": "QB",
        "team": "SEA",
        "udAdp": 354,
        "udPick": "30.6",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "354",
        "name": "Ty Simpson",
        "pos": "QB",
        "team": "LAR",
        "udAdp": 355,
        "udPick": "30.7",
        "sleeperAdp": 241,
        "sleeperPick": "21.1"
    },
    {
        "id": "355",
        "name": "Marcus Mariota",
        "pos": "QB",
        "team": "WAS",
        "udAdp": 356,
        "udPick": "30.8",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "356",
        "name": "Connor Heyward",
        "pos": "TE",
        "team": "LV",
        "udAdp": 357,
        "udPick": "30.9",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "357",
        "name": "Tyson Bagent",
        "pos": "QB",
        "team": "CHI",
        "udAdp": 358,
        "udPick": "30.10",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "358",
        "name": "Joe Milton III",
        "pos": "QB",
        "team": "DAL",
        "udAdp": 359,
        "udPick": "30.11",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "359",
        "name": "Phil Mafah",
        "pos": "RB",
        "team": "DAL",
        "udAdp": 360,
        "udPick": "30.12",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "360",
        "name": "Reggie Virgil",
        "pos": "WR",
        "team": "ARI",
        "udAdp": 361,
        "udPick": "31.1",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "361",
        "name": "Jake Browning",
        "pos": "QB",
        "team": "TB",
        "udAdp": 362,
        "udPick": "31.2",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "362",
        "name": "Haynes King",
        "pos": "QB",
        "team": "CAR",
        "udAdp": 363,
        "udPick": "31.3",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "363",
        "name": "Kareem Hunt",
        "pos": "RB",
        "team": "FA",
        "udAdp": 364,
        "udPick": "31.4",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "364",
        "name": "Darren Waller",
        "pos": "TE",
        "team": "FA",
        "udAdp": 365,
        "udPick": "31.5",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "365",
        "name": "Jeff Caldwell",
        "pos": "WR",
        "team": "KC",
        "udAdp": 366,
        "udPick": "31.6",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "366",
        "name": "Nick Chubb",
        "pos": "RB",
        "team": "FA",
        "udAdp": 367,
        "udPick": "31.7",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "367",
        "name": "Joe Royer",
        "pos": "TE",
        "team": "CLE",
        "udAdp": 368,
        "udPick": "31.8",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "368",
        "name": "Jack Endries",
        "pos": "TE",
        "team": "CIN",
        "udAdp": 369,
        "udPick": "31.9",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "369",
        "name": "John Metchie III",
        "pos": "WR",
        "team": "CAR",
        "udAdp": 370,
        "udPick": "31.10",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "370",
        "name": "KeAndre Lambert-Smith",
        "pos": "WR",
        "team": "LAC",
        "udAdp": 371,
        "udPick": "31.11",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "371",
        "name": "Sam Roush",
        "pos": "TE",
        "team": "CHI",
        "udAdp": 372,
        "udPick": "31.12",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "372",
        "name": "Austin Hooper",
        "pos": "TE",
        "team": "ATL",
        "udAdp": 373,
        "udPick": "32.1",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "373",
        "name": "Demarcus Robinson",
        "pos": "WR",
        "team": "SF",
        "udAdp": 374,
        "udPick": "32.2",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "374",
        "name": "Tyler Higbee",
        "pos": "TE",
        "team": "LAR",
        "udAdp": 375,
        "udPick": "32.3",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "375",
        "name": "Josh Oliver",
        "pos": "TE",
        "team": "MIN",
        "udAdp": 376,
        "udPick": "32.4",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "376",
        "name": "Ben Sinnott",
        "pos": "TE",
        "team": "WAS",
        "udAdp": 377,
        "udPick": "32.5",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "377",
        "name": "Will Howard",
        "pos": "QB",
        "team": "PIT",
        "udAdp": 378,
        "udPick": "32.6",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "378",
        "name": "Tyrell Shavers",
        "pos": "WR",
        "team": "BUF",
        "udAdp": 379,
        "udPick": "32.7",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "379",
        "name": "Roman Wilson",
        "pos": "WR",
        "team": "PIT",
        "udAdp": 380,
        "udPick": "32.8",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "380",
        "name": "Nate Boerkircher",
        "pos": "TE",
        "team": "JAC",
        "udAdp": 381,
        "udPick": "32.9",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "381",
        "name": "Isaac Guerendo",
        "pos": "RB",
        "team": "SF",
        "udAdp": 382,
        "udPick": "32.10",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "382",
        "name": "Tyrod Taylor",
        "pos": "QB",
        "team": "GB",
        "udAdp": 383,
        "udPick": "32.11",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "383",
        "name": "Teddy Bridgewater",
        "pos": "QB",
        "team": "DET",
        "udAdp": 384,
        "udPick": "32.12",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "384",
        "name": "Mo Alie-Cox",
        "pos": "TE",
        "team": "IND",
        "udAdp": 385,
        "udPick": "33.1",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "385",
        "name": "Isaiah Hodgins",
        "pos": "WR",
        "team": "NYG",
        "udAdp": 386,
        "udPick": "33.2",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "386",
        "name": "Dylan Laube",
        "pos": "RB",
        "team": "LV",
        "udAdp": 387,
        "udPick": "33.3",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "387",
        "name": "Damien Martinez",
        "pos": "RB",
        "team": "GB",
        "udAdp": 388,
        "udPick": "33.4",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "388",
        "name": "Caleb Lohner",
        "pos": "TE",
        "team": "DEN",
        "udAdp": 389,
        "udPick": "33.5",
        "sleeperAdp": 999,
        "sleeperPick": ""
    },
    {
        "id": "389",
        "name": "Cedrick Wilson Jr.",
        "pos": "WR",
        "team": "DET",
        "udAdp": 390,
        "udPick": "33.6",
        "sleeperAdp": 999,
        "sleeperPick": ""
    }
];
