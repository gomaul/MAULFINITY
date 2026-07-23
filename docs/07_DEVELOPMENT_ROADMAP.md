MAULFINITY
DEVELOPMENT ROADMAP
SPRINT 0 — PROJECT FOUNDATION
Tujuan Sprint 0

Membuat aplikasi kosong yang sudah punya:

✅ Electron berjalan
✅ React berjalan
✅ TypeScript aktif
✅ Tailwind aktif
✅ Struktur folder sesuai arsitektur
✅ IPC dasar aktif
✅ SQLite siap
✅ Logging siap

Belum ada:

❌ TikTok
❌ OBS
❌ Overlay
❌ Trigger
❌ Plugin

Kenapa?

Karena kalau pondasinya salah, semua modul berikutnya akan ikut rusak.

1. Membuat Project

Nama folder:

Maulfinity

Struktur awal:

Maulfinity/

├── src/

│   ├── main/
│   │   ├── index.ts
│   │   ├── window.ts
│   │   └── ipc/

│   ├── preload/
│   │   └── index.ts

│   ├── renderer/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── components/


│   ├── core/
│   │   ├── event-bus/
│   │   ├── logger/
│   │   └── config/


│   ├── services/
│   │   └── database/


│   └── shared/


├── resources/

├── database/

├── logs/

├── plugins/

├── profiles/

├── assets/


├── package.json

├── tsconfig.json

├── vite.config.ts

└── README.md

2. Teknologi Awal
Desktop

Electron

UI

React + TypeScript

Build

Vite

Styling

Tailwind CSS

Database

SQLite

Logging

Custom Logger

3. Tampilan Pertama

Saat aplikasi dibuka:

+--------------------------------+

| MAULFINITY                      |

|                                |

| System Status                  |

|                                |

| Electron: OK                   |

| Database: Connected            |

| IPC: Active                    |

|                                |

+--------------------------------+


Ini bukan dashboard final.

Ini hanya tanda:

"Mesin Maulfinity hidup."

4. Modul Pertama

Kita buat:

Application Core

File:

src/core/application/


Tugas:

Startup
Shutdown
Load service

Contoh flow:

Maulfinity.exe

↓

main/index.ts

↓

Application Core

↓

Database Service

↓

Logger

↓

Open Window

5. Event Bus Awal

Walaupun TikTok belum ada, kita siapkan jantungnya.

File:

src/core/event-bus/


Tujuan:

Nanti:

TikTok:

Gift

↓

Event Bus

↓

Trigger


YouTube:

Superchat

↓

Event Bus

↓

Trigger

6. Database Awal

Pertama hanya buat:

database.db

Table awal:

app_settings
id

key

value


Contoh:

theme = dark

language = id

7. IPC Pertama

Test:

React:

"Ambil versi aplikasi"

↓

IPC

↓

Electron

↓

Return:

Maulfinity v0.1.0
8. Checklist Sprint 0

Selesai jika:

☑ Aplikasi bisa dibuka
☑ Window Electron muncul
☑ React tampil
☑ Tailwind aktif
☑ Database dibuat
☑ IPC berfungsi
☑ Folder sesuai arsitektur
☑ Tidak ada error console

Prompt untuk Freebuff (Sprint 0)

Jangan kasih semua dokumen dulu.

Kasih:

You are working on Maulfinity.

Read the provided SRS and Architecture documents.

For this task, only implement Sprint 0: Project Foundation.

Do not implement TikTok, OBS, Overlay, Trigger, or Plugin yet.

Create:

- Electron + React + TypeScript project
- Tailwind CSS setup
- Proper modular folder structure
- IPC foundation
- SQLite initialization
- Basic logging system

Before writing code:
1. Explain implementation plan.
2. List files to create.
3. Explain dependencies.

Follow Maulfinity architecture rules.
Setelah Sprint 0 berhasil

MAULFINITY
DEVELOPMENT ROADMAP
SPRINT 1 — CORE ENGINE FOUNDATION
Tujuan Sprint 1

Di Sprint 0 kita sudah punya "badan" aplikasi:

Electron hidup
React tampil
Database siap
IPC aktif

Sekarang kita buat otak Maulfinity.

Di sprint ini kita belum menyentuh:

❌ TikTok
❌ YouTube
❌ OBS
❌ Game
❌ Overlay Editor

Kita fokus membuat mesin internal yang nanti semua fitur akan pakai.

1. CORE ENGINE OVERVIEW

Arsitektur:

                 MAULFINITY CORE


                    Application

                        |

        --------------------------------

        |              |              |

    Event Bus    Service Manager   Config


        |

        |

    Module System


        |

        |

 Trigger Engine
 Action Engine
 Connector
 Plugin

2. MODULE YANG DIBUAT

Sprint 1 membuat:

src/core/


├── application/
│
├── event-bus/
│
├── module-manager/
│
├── service-container/
│
├── config-manager/
│
└── constants/

3. APPLICATION CORE
Tanggung jawab

Mengatur lifecycle aplikasi.

Flow:

START


↓

Initialize Core


↓

Load Config


↓

Start Services


↓

Load Modules


↓

Ready


Interface
interface Application {


start(): Promise<void>


stop(): Promise<void>


status(): string


}

4. SERVICE CONTAINER
Fungsi

Tempat semua service terdaftar.

Contoh nanti:

DatabaseService

LoggerService

TikTokService

OBSService

OverlayService


Daripada:

const db = new Database()

di semua file.

Kita:

container.get(DatabaseService)


Keuntungan:

mudah testing
modul tidak saling ketergantungan
mudah mengganti implementasi
5. EVENT BUS

Ini jantung Maulfinity.

Semua komunikasi event melalui sini.

Contoh nanti:

TikTok:

Gift Rose

↓

Event Bus

↓

Trigger Engine

↓

Keyboard Action

Struktur Event
interface EventPayload {


type:string;


source:string;


data:any;


timestamp:number;


}


Contoh:

{
"type":"gift",

"source":"tiktok",

"data":{

"name":"rose",

"value":1

}

}

Event Bus Function
on()

emit()

off()

once()


Contoh:

Listener:

eventBus.on(
"gift",
(data)=>{

console.log(data)

}
)


Emit:

eventBus.emit(
"gift",
{

name:"rose"

}

)

6. MODULE MANAGER
Fungsi

Mengatur modul Maulfinity.

Contoh:

Nanti:

TikTok Module

OBS Module

Plugin Module

Overlay Module


Interface:

interface Module {


name:string;


initialize():void;


destroy():void;


}


Lifecycle:

Installed

↓

Loaded

↓

Initialized

↓

Running

↓

Stopped

7. CONFIG MANAGER

Mengatur:

Settings

Theme

Language

Paths

User Preference


Lokasi:

%APPDATA%/Maulfinity/config.json


Format:

{

"language":"id",

"theme":"dark",

"autoUpdate":true

}


Function:

get()

set()

save()

reload()

8. LOGGER SYSTEM

Semua modul wajib menggunakan logger.

Jangan:

console.log()


Gunakan:

logger.info()

logger.error()

logger.warning()

logger.debug()


Output:

logs/

2026-07-22.log


Format:

[10:22:01]

[INFO]

[EVENT-BUS]

Started successfully

9. ERROR HANDLING

Setiap modul:

Wajib punya:

try {


}

catch(error){


logger.error(error)


}


Error standard:

interface MaulfinityError {


code:string;


module:string;


message:string;


}

10. INTERNAL TEST SYSTEM

Sebelum TikTok ada, kita simulasi event.

Tambahkan:

Developer Console

Contoh:

Input:

test gift rose

System:

EVENT RECEIVED

type:
gift

gift:
rose


Tujuannya:

Nanti saat TikTok masuk, kita sudah tahu event engine bekerja.