MAULFINITY
Software Architecture Document (SAD)
Version 1.0
PART 3 — ARCHITECTURE BLUEPRINT
21. ARCHITECTURE PRINCIPLE

Maulfinity menggunakan konsep:

Modular Local-First Desktop Architecture

Prinsip utama:

Setiap fitur adalah modul terpisah.
Core engine tidak bergantung pada UI.
UI hanya mengontrol sistem melalui IPC.
Semua event menggunakan Event Bus.
Semua resource berada di komputer pengguna.
Plugin dapat ditambahkan tanpa mengubah core.
22. HIGH LEVEL SYSTEM ARCHITECTURE
                         INTERNET
                            |
        -----------------------------------------
        |                                       |
   TikTok Connector                     YouTube Connector
        |                                       |
        -----------------------------------------
                            |
                            |
                    EVENT PROCESSOR
                            |
                    UNIVERSAL EVENT BUS
                            |
        ------------------------------------------------
        |              |              |                |
 Trigger Engine   Overlay Engine  Action Engine   Logger
        |              |              |
        |              |              |
 Game Control       OBS Control    Automation
        |
        |
 Game Plugin


======================================================

                    ELECTRON APPLICATION


        Renderer Process
        (React UI)

              |
              |
          IPC Bridge

              |
              |

        Main Process

              |
              |

        Core Services


======================================================

                 LOCAL STORAGE


 SQLite Database

 Assets

 Plugins

 Profiles

 Config

 Logs

23. TECHNOLOGY STACK
Desktop Framework
Electron

Alasan:

Windows support
Mudah membuat installer
Bisa akses system API
Cocok untuk OBS ecosystem
Frontend
React + TypeScript

Digunakan untuk:

Dashboard
Trigger Editor
Overlay Editor
Settings

Alasan:

Ecosystem besar
Component based
Mudah maintenance
Styling
Tailwind CSS

Digunakan untuk:

UI cepat
Responsive panel
Theme system
Animation
Framer Motion

Untuk:

UI animation
Transition
Panel movement
Backend Runtime
Node.js

Digunakan untuk:

Event processing
Connector
Plugin system
Local server
Database
SQLite

Alasan:

Local
Tidak perlu server
Portable
Cepat
24. PROJECT FOLDER STRUCTURE

Struktur final:

Maulfinity/

│
├── package.json
├── electron-builder.yml
├── tsconfig.json
│
│
├── src/
│
│   ├── main/
│   │
│   │   ├── index.ts
│   │   ├── window.ts
│   │   ├── ipc/
│   │   └── security/
│   │
│   │
│   ├── preload/
│   │
│   │   └── index.ts
│   │
│   │
│   ├── renderer/
│   │
│   │   ├── app/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── stores/
│   │
│   │
│   ├── core/
│   │
│   │   ├── event-bus/
│   │   ├── trigger-engine/
│   │   ├── action-engine/
│   │   ├── resource-manager/
│   │   ├── profile-manager/
│   │   └── config-manager/
│   │
│   │
│   ├── services/
│   │
│   │   ├── database/
│   │   ├── logger/
│   │   ├── updater/
│   │   └── license/
│   │
│   │
│   ├── connectors/
│   │
│   │   ├── tiktok/
│   │   ├── youtube/
│   │   └── obs/
│   │
│   │
│   ├── overlay/
│   │
│   │   ├── renderer/
│   │   ├── editor/
│   │   └── widgets/
│   │
│   │
│   ├── plugins/
│   │
│   │   ├── loader/
│   │   ├── manager/
│   │   └── api/
│   │
│   │
│   └── shared/
│
│
├── resources/
│
│   ├── assets/
│   ├── templates/
│   ├── sounds/
│   └── fonts/
│
│
├── plugins/
│
├── profiles/
│
├── database/
│
└── logs/

25. CORE ENGINE DESIGN
25.1 Event Bus

Ini adalah jantung Maulfinity.

Semua komunikasi menggunakan event.

Contoh:

TikTok:

Gift Received

↓

Event Bus

↓

Trigger Engine

↓

Action


Format event:

{
 id:string,

 type:string,

 platform:string,

 user:string,

 payload:Object,

 timestamp:number
}


Contoh:

{
"type":"gift",
"platform":"tiktok",
"user":"alex",
"payload":{
"gift":"rose",
"value":1
}
}

26. TRIGGER ENGINE ARCHITECTURE
Event

 |

 |

Trigger Matcher

 |

 |

Condition Checker

 |

 |

Action Queue

 |

 |

Action Runner


Contoh:

Gift Lion

↓

Check Trigger

↓

Execute:

Keyboard F10

+

Overlay

+

Sound

27. ACTION ENGINE ARCHITECTURE

Action harus modular.

Struktur:

actions/

keyboard/

websocket/

obs/

sound/

tts/

game/


Setiap action:

Action Plugin

{

name

validate()

execute()

settings()

}

28. OBS ARCHITECTURE

Communication:

Maulfinity

       |

OBS WebSocket

       |

OBS Studio


Function:

Switch Scene
Show Source
Hide Source
Update Browser Source
29. OVERLAY ARCHITECTURE

Overlay bukan gambar biasa.

Konsep:

Overlay Project

       |

Scene

       |

Layers

       |

Objects

       |

Animation


Contoh:

Gift Alert

|
|- Avatar
|- Text
|- Animation
|- Sound
30. PLUGIN ARCHITECTURE

Plugin berada:

Maulfinity/plugins/


Example:

GTA Plugin

Minecraft Plugin

Discord Plugin


Plugin lifecycle:

Install

↓

Load

↓

Initialize

↓

Register

↓

Run

↓

Unload

31. IPC ARCHITECTURE

Electron:

React UI

   |

Preload

   |

IPC Channel

   |

Main Process

   |

Core Service


Contoh:

UI klik:

"Tambah Trigger"

IPC:

trigger:create


Main:

Save Database


Return:

Success

32. SECURITY MODEL
Renderer tidak boleh:
akses file
akses database
akses system command

Semua melalui:

Preload API

33. LOCAL STORAGE DESIGN

Runtime:

C:\Program Files\Maulfinity


Berisi:

Application Files

Plugins Default

Resources


User Data:

AppData/Roaming/Maulfinity


Berisi:

database

profiles

settings

logs

license

cache

34. FUTURE READY SYSTEM

Walaupun versi pertama sederhana, arsitektur siap:

Cloud

Future:

Cloud backup
Marketplace
Plugin Store

Future:

User upload plugin
Community Sharing

Future:

Share profile
AI Assistant

Future:

Generate trigger
Generate overlay
35. DEVELOPMENT RULE FOR AI CODING ASSISTANT

Ini wajib diberikan ke Freebuff:

RULES:

1. Never put all logic in one file.

2. Every feature must be a separated module.

3. Follow existing folder architecture.

4. Do not modify unrelated modules.

5. Before coding, explain implementation plan.

6. Generate TypeScript only.

7. Keep functions small.

8. Use interfaces between modules.

9. Database changes require migration.

10. Every module must have documentation.

END PART 3