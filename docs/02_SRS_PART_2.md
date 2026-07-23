MAULFINITY
Software Requirements Specification (SRS)
Version 1.0
PART 2 — Detailed Technical Specification
7. FUNCTIONAL REQUIREMENTS
7.1 Live Connection System
Requirement ID

MF-LIVE-001

Description

Maulfinity harus dapat menerima event realtime dari platform livestream.

TikTok Connector

Priority:

Critical

Supported connection method:

Method 1 — Username Connection

User memasukkan:

TikTok Username

System:

Username

↓

Find Live Room

↓

Connect

↓

Receive Events
Method 2 — QR Login

Future:

Scan QR

↓

Authorize Account

↓

Connect Live
Connection Status

UI harus menampilkan:

DISCONNECTED

CONNECTING

CONNECTED

RECONNECTING

ERROR
Auto Reconnect

Jika koneksi terputus:

Connection Lost

↓

Retry

↓

Reconnect

↓

Restore Event Stream

8. EVENT SYSTEM REQUIREMENT
8.1 Universal Event Format

Semua platform harus diubah menjadi format standar.

Example:

TikTok:

{
"type":"gift",
"platform":"tiktok",
"user":"viewer01",
"gift":"rose",
"value":1,
"time":123456
}

YouTube:

{
"type":"superchat",
"platform":"youtube",
"user":"viewer02",
"value":50000
}

Tujuan:

Agar Trigger Engine tidak peduli sumber event.

9. TRIGGER ENGINE SPECIFICATION
9.1 Trigger Structure

Setiap trigger memiliki:

{
"name":"Rose Attack",

"event":"gift",

"condition":{

},

"actions":[

]

}
9.2 Trigger Condition

Support:

Gift Condition

Example:

Gift = Lion
Value Condition

Example:

Coin > 100
Username Condition

Example:

User = VIP_User
Keyword Condition

Example:

Comment:

!boom
9.3 Multiple Action

Satu event bisa menjalankan banyak aksi.

Example:

Gift Dragon

↓

Action 1:
OBS Scene Change


Action 2:
Play Sound


Action 3:
Overlay Animation


Action 4:
TTS

10. ACTION ENGINE SPECIFICATION
Action Interface

Semua action harus mengikuti:

interface Action {

execute()

validate()

settings()

}

Built-in Action
Keyboard Action

Function:

Mengirim input keyboard.

Example:

Gift Rose

↓

Press F10
WebSocket Action

Function:

Mengirim data ke aplikasi eksternal.

Example:

{
"command":"spawn_shark"
}


Target:

Game Plugin
Custom Script
External Application
Future Action

Architecture harus siap:

HTTP

UDP

TCP

OSC

MQTT

Serial

PowerShell

EXE Launcher

11. GAME INTEGRATION SYSTEM
Purpose

Memberikan kemampuan game menerima command dari Maulfinity.

Communication Layer

Recommended:

Maulfinity

↓

WebSocket Server

↓

Game Plugin

↓

Game Action

Initial Supported Game

Priority:

1. GTA V / FiveM

Example:

Gift Tank

↓

Spawn Tank

2. Minecraft

Example:

Gift Creeper

↓

Spawn Creeper

3. Roblox

Example:

Gift Sword

↓

Give Item


Future:

Red Dead Redemption
Unity Games
Unreal Games
12. OVERLAY SYSTEM
12.1 Overlay Architecture

Overlay berjalan sebagai:

Local Web Server

        |

HTML/CSS/JS

        |

OBS Browser Source

Overlay Object

Setiap element:

{
"type":"image",

"position":{

"x":100,

"y":200

},

"animation":"bounce"

}

12.2 Overlay Editor

Required:

Drag & Drop:

Text
Image
Video
GIF
Audio
Widget
Animation Support
Fade
Slide
Scale
Rotate
Bounce
Custom CSS
13. RESOURCE MANAGEMENT
Local Resource Structure
Maulfinity

/resources


/assets

/images

/videos

/audio

/fonts

/templates


Asset Manager

Function:

Import
Preview
Rename
Delete
Search
Category
14. DATABASE REQUIREMENT

Database:

SQLite

Location:

AppData/Roaming/Maulfinity/database.db
Tables
users
id

username

license

created_at

profiles
id

name

settings

created_at

triggers
id

profile_id

event

condition

actions

events_history
id

platform

event_type

payload

timestamp

assets
id

type

path

metadata

plugins
id

name

version

enabled

15. IPC ARCHITECTURE

Electron:

Renderer

(UI)

 |

 |

Preload

 |

 |

IPC

 |

 |

Main Process

 |

 |

Core Services

IPC Rule

Renderer tidak boleh langsung mengakses:

File system
Database
Network

Semua melalui IPC.

Example:

UI:

Load Profile

↓

IPC:

profile:get

↓

Main:

Database Query


↓

Return:

Profile Data
16. PLUGIN SYSTEM
Goal

User/developer dapat membuat extension.

Plugin dapat:

Membuat action
Membaca event
Membuat UI
Membuat connector

Plugin Structure:

plugin-name

|

manifest.json

main.js

assets/

ui/


Manifest:

{
"name":"GTA Plugin",

"version":"1.0",

"type":"game"

}

17. SECURITY REQUIREMENT
Plugin Permission

Plugin harus meminta izin:

Example:

GTA Plugin

Permission:

[x] Keyboard

[x] Network

[ ] File Access

18. UPDATE SYSTEM

Support:

Auto Update
Version Check
Rollback

Version:

Major.Minor.Patch

1.0.0

19. DEVELOPMENT RULES
Code Standard

Language:

TypeScript

Architecture Rules:

Tidak boleh:

main.js
berisi semua logic

Wajib:

Module Based Architecture
20. DEVELOPMENT ROADMAP
Phase 1 — Foundation

Target:

Aplikasi dapat berjalan.

Feature:

Electron
React
Database
Settings
Profile
Phase 2 — Event System

Feature:

TikTok connection
Event engine
Phase 3 — Automation

Feature:

Trigger
Keyboard
WebSocket
Phase 4 — Streaming

Feature:

OBS
Overlay
TTS
Phase 5 — Creator Tools

Feature:

Overlay Editor
Asset Manager
Phase 6 — Public Release

Feature:

Account
License
Plugin
Update
END PART 2