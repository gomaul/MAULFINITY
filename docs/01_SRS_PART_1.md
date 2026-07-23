MAULFINITY
Software Requirements Specification (SRS)
Version 1.0

Project Name: Maulfinity
Document Type: Software Requirements Specification
Version: 1.0
Platform: Windows Desktop Application
Architecture: Local-First Desktop Streaming Automation Platform
Primary Technology: Electron + React + TypeScript + Node.js + SQLite

DOCUMENT CONTROL
Purpose

Dokumen ini mendefinisikan kebutuhan sistem, fitur, arsitektur, modul, dan aturan pengembangan aplikasi Maulfinity.

Dokumen ini menjadi referensi utama untuk:

Developer
AI Coding Assistant
Plugin Developer
Future Contributor

Semua implementasi harus mengikuti spesifikasi dalam dokumen ini.

1. PROJECT OVERVIEW
1.1 Product Description

Maulfinity adalah aplikasi desktop streaming automation yang menghubungkan aktivitas livestream dengan berbagai aksi otomatis pada komputer pengguna.

Aplikasi memungkinkan streamer mengontrol:

Game
OBS Studio
Overlay
Audio
Text To Speech
Automation
Interactive Event

berdasarkan event yang terjadi pada livestream.

Contoh:

Viewer mengirim Gift Rose

↓

Maulfinity menerima event

↓

Trigger System membaca aturan

↓

Action dijalankan

↓

Game berubah
Overlay muncul
Sound dimainkan
TTS berjalan
1.2 Vision

Membangun platform streaming automation all-in-one yang:

Berjalan secara lokal
Ringan
Modular
Mudah dikustomisasi
Mendukung kreativitas streamer tanpa batas
1.3 Core Philosophy

Maulfinity menggunakan konsep:

Local First Architecture

Data utama berada di komputer pengguna:

Application
|
├── Config
├── Database
├── Assets
├── Plugins
├── Profiles
├── Overlay
└── Logs


Internet hanya digunakan untuk:

Menghubungkan platform live
Login
Update
Sinkronisasi akun
2. TARGET USER
Primary User

Streamer:

Gaming streamer
VTuber
Content creator
Live entertainer
Secondary User

Future:

Agency streamer
Event organizer
Plugin developer
3. SYSTEM GOALS
Main Goals
G1 — Live Interaction

Menghubungkan event livestream dengan aksi otomatis.

G2 — Game Interaction

Mengontrol game atau aplikasi eksternal.

G3 — Creative Overlay

Memberikan sistem overlay yang fleksibel.

G4 — Automation

Mengurangi kebutuhan software tambahan.

G5 — Extensibility

Mendukung plugin dan integrasi pihak ketiga.

4. SUPPORTED PLATFORM
Version 1 Target
TikTok Live

Priority:

HIGH

Supported Event:

Event	Support
Gift	YES
Gift Combo	YES
Like	YES
Follow	YES
Comment	YES
Share	YES
Join	YES
Subscribe	YES
Goal	YES
YouTube Live

Supported:

Event	Support
Super Chat	YES
Membership	YES
Comment	YES
Subscribe	YES
5. SYSTEM ARCHITECTURE OVERVIEW

High Level Architecture:

                 INTERNET

                     |
                     |

        TikTok Connector
        YouTube Connector


                     |

              EVENT ENGINE

                     |

        +------------+-------------+

        |            |             |

 Trigger Engine  Action Engine  Overlay Engine


        |            |             |

     Game       OBS          Browser Source


                     |

              Local Database

6. CORE MODULES
6.1 Application Core

Responsibility:

Mengatur lifecycle aplikasi.

Function:

Startup
Shutdown
Service management
Error handling
Module loading
6.2 Event Engine
Responsibility

Pusat distribusi semua event.

Input:

TikTok
YouTube
Plugin
Internal Event

Output:

Trigger System
Overlay
Logger
Statistics

Example:

Input:

{
"type":"gift",
"user":"Alex",
"gift":"Rose",
"value":1
}

Output:

Trigger Listener menerima event
6.3 Trigger Engine
Responsibility

Mengubah event menjadi keputusan.

Format:

WHEN

Event


IF

Condition


THEN

Action


Example:

WHEN Gift Rose

THEN

Press Keyboard F10

Show Overlay

Play Sound


Supported Conditions:

Gift Name
Gift Value
Coin Amount
Username
Keyword
Platform
Custom Variable
6.4 Action Engine
Responsibility

Menjalankan aksi.

Version 1:

Supported:

Keyboard

Contoh:

Send F10
WebSocket

Contoh:

Send Command:

spawn_shark


Future:

HTTP
UDP
OSC
MQTT
Serial
6.5 Overlay Engine
Responsibility

Mengelola visual interaksi.

Support:

PNG
GIF
MP4
WebM
HTML
CSS Animation
Lottie
Sprite Animation

Output:

OBS Browser Source:

localhost://maulfinity-overlay
6.6 Overlay Creator

User dapat membuat:

Alert
Widget
Character animation
Gift reaction
Counter
Chat box

Tanpa coding.

6.7 OBS Integration

Support:

Scene Switch
Source Visibility
Source Update
Filter Control

Communication:

Maulfinity

↓

OBS WebSocket

↓

OBS Studio

6.8 TTS Engine

Function:

Mengubah text menjadi suara.

Source:

Comment
Gift
Custom Event

Example:

Viewer:

"semangat bang"


↓

TTS

↓

Voice Output

6.9 Resource Manager

Mengatur:

Assets

Images

Videos

Audio

Fonts

Plugins

Templates

6.10 Profile Manager

User dapat membuat:

Example:

Profile:

GTA Stream

Minecraft Stream

Roblox Stream


Setiap profile memiliki:

Triggers

Overlay

OBS Scene

Plugin

Settings