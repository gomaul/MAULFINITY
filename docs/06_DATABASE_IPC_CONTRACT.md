MAULFINITY
DATABASE, API & IPC CONTRACT SPECIFICATION
Version 1.0
PART 6 — DATA COMMUNICATION BLUEPRINT
78. DATA ARCHITECTURE PRINCIPLE

Maulfinity menggunakan prinsip:

Single Source of Truth

Semua data penting memiliki sumber utama.

Contoh:

Trigger Data

        |
        |
     SQLite

        |
        |
 Trigger Engine
 UI
 Plugin


Tidak boleh:

UI punya data sendiri
Engine punya data sendiri
Plugin punya data sendiri

karena nanti tidak sinkron.

79. DATA STORAGE ARCHITECTURE

Maulfinity memiliki 3 jenis penyimpanan:

79.1 Application Data

Lokasi:

Windows:

C:\Program Files\Maulfinity

Isi:

Core Application

Default Plugin

System Resource

79.2 User Data

Lokasi:

%APPDATA%\Maulfinity

Isi:

database.db

config.json

profiles

assets

logs

plugins

cache

79.3 Temporary Data

Lokasi:

%TEMP%\Maulfinity

Isi:

runtime cache

download temp

overlay cache

80. DATABASE DESIGN

Database:

SQLite

Engine:

better-sqlite3
81. DATABASE TABLES
81.1 Users Table

Tujuan:

Menyimpan account Maulfinity.

users

id
username
email
avatar
license_type
created_at
updated_at


Example:

id:
001

username:
gomaul

license:
personal

81.2 Profiles Table

Tujuan:

Menyimpan konfigurasi streaming.

profiles

id

name

description

settings_json

created_at

updated_at


Example:

Profile:

GTA Chaos


settings:

OBS
Overlay
Trigger
Plugin

81.3 Connectors Table

Menyimpan platform.

connectors

id

profile_id

platform

username

status

config_json


Example:

{
"platform":"tiktok",

"username":"maulstream",

"autoReconnect":true

}
81.4 Events Table

Menyimpan history.

events


id

platform

event_type

username

payload_json

created_at


Example:

{
"type":"gift",

"gift":"lion",

"value":100

}
81.5 Triggers Table
triggers


id

profile_id

name

enabled

event_type

condition_json

actions_json

created_at


Example:

{
"name":"Tank Attack",

"event":"gift",

"condition":

{
"gift":"lion"
}

}

81.6 Actions Table
actions


id

trigger_id

type

config_json

order_number


Example:

{
"type":"keyboard",

"key":"F10"

}

81.7 Assets Table
assets


id

name

type

category

path

metadata_json

created_at


Example:

{
"type":"image",

"path":

"/assets/gift/rose.png"

}

81.8 Overlay Table
overlays


id

profile_id

name

scene_json

created_at

updated_at


Scene:

{
"objects":[

{
"type":"image",

"x":100,

"y":200

}

]

}

81.9 Plugins Table
plugins


id

name

version

enabled

permissions_json

path

81.10 Logs Table
logs


id

level

module

message

timestamp

82. EVENT DATA CONTRACT

Semua event harus mengikuti format universal.

Interface:

interface MaulfinityEvent {


id:string;


type:string;


platform:string;


user:UserInfo;


payload:any;


timestamp:number;


}

83. EVENT TYPE

Standard:

enum EventType {


GIFT,

LIKE,

FOLLOW,

COMMENT,

SHARE,

JOIN,

SUBSCRIBE,

SUPERCHAT,


CUSTOM


}

84. USER DATA FORMAT
interface EventUser {


id:string;


username:string;


displayName:string;


avatar?:string;


}

85. GIFT EVENT FORMAT

Example:

{
"id":"evt001",


"type":"gift",


"platform":"tiktok",


"user":{

"username":"alex"

},


"payload":{

"giftName":"rose",

"count":1,

"value":1

}

}

86. ACTION DATA CONTRACT

Semua action:

interface Action {


id:string;


type:string;


execute(data:any):Promise<void>;


validate():boolean;


}

87. ACTION TYPES

Initial:

enum ActionType {


KEYBOARD,


WEBSOCKET,


OBS,


SOUND,


TTS,


OVERLAY


}

88. IPC ARCHITECTURE

Electron memiliki 3 layer:

Renderer

(UI)

    |

Preload

(Security Bridge)

    |

Main Process

(Core)


89. IPC RULE

Renderer tidak boleh:

❌ File System

❌ Database

❌ Node API

❌ Execute Command

Renderer hanya:

Request:

"buat trigger"

Main:

proses

save database


Return:

success

90. IPC CHANNEL STANDARD

Format:

module:command

SYSTEM
system:getVersion

system:getStatus

system:restart

PROFILE
profile:list

profile:create

profile:update

profile:delete

TRIGGER
trigger:list

trigger:create

trigger:update

trigger:delete

trigger:test

ASSET
asset:list

asset:import

asset:delete

asset:scan

CONNECTOR
connector:connect

connector:disconnect

connector:status

OVERLAY
overlay:list

overlay:save

overlay:preview

PLUGIN
plugin:list

plugin:install

plugin:disable

plugin:remove

91. PRELOAD API DESIGN

Renderer menerima API:

window.maulfinity


Example:

window.maulfinity.trigger.create(data)


API:

maulfinity.profile

maulfinity.trigger

maulfinity.asset

maulfinity.overlay

maulfinity.connector

maulfinity.plugin

maulfinity.system

92. WEBSOCKET SERVER DESIGN

Maulfinity menyediakan local websocket.

Tujuan:

Game plugin
External tool
Custom script

Default:

localhost:8765


Message:

{

"event":"spawn",

"data":{

"object":"tank"

}

}

93. PLUGIN API CONTRACT

Plugin mendapatkan:

MaulfinityAPI


Available:

Events
events.on()

events.emit()

Actions
actions.register()

Storage
storage.get()

storage.set()

Overlay
overlay.create()

94. CONFIG FILE FORMAT

config.json

{

"language":"id",

"theme":"dark",


"autoUpdate":true,


"storagePath":"default"


}

95. PROFILE EXPORT FORMAT

Extension:

.maulprofile


Isi:

profile.json

triggers/

overlay/

assets/

settings/


Tujuan:

Export:

GTA Stream Profile.maulprofile


Import:

PC lain

↓

Import

↓

Semua setup kembali

96. ERROR CONTRACT

Semua error:

interface MaulfinityError {


code:string;


module:string;


message:string;


timestamp:number;


}


Example:

{

"code":"TIKTOK_CONNECTION_FAILED",

"module":"TikTokConnector",

"message":"Unable to connect"

}

97. LOGGING SYSTEM

Level:

DEBUG

INFO

WARNING

ERROR

CRITICAL


Format:

[TIME]

[LEVEL]

[MODULE]

MESSAGE


Example:

10:20:31

ERROR

OBS

Connection Failed

98. FUTURE COMPATIBILITY

Semua contract harus:

Versioned
Backward compatible
Tidak merusak profile lama

Contoh:

API Version:

v1

v2

END PART 6