MAULFINITY
UI/UX DESIGN SPECIFICATION
Version 1.0
PART 5 — USER INTERFACE & EXPERIENCE DESIGN
53. DESIGN PHILOSOPHY
Concept

Maulfinity menggunakan konsep:

Futuristic Gaming Control Center

Inspirasi:

OBS Studio
Streamer.bot
Discord
Unreal Engine Editor
Game HUD

Namun dibuat lebih modern dan ramah streamer.

Design Goal

UI harus memberikan kesan:

Powerful
Professional
Futuristic
Customizable
Easy to understand
54. DESIGN SYSTEM
Theme Support

Maulfinity memiliki 2 mode.

Dark Mode

Default.

Karakter:

Gaming
Streaming
Professional
Light Mode

Untuk:

Editing
Configuration
Office environment
55. COLOR SYSTEM
Dark Theme

Background:

#0B0F19

Panel:

#111827

Card:

#182235

Accent:

Electric Blue

Purple

Neon Cyan
Light Theme

Background:

#F8FAFC

Panel:

FFFFFF

Accent:

Blue

Purple
56. TYPOGRAPHY

Primary:

Inter

Usage:

Dashboard
Setting
Menu

Secondary:

JetBrains Mono

Usage:

Logs
Console
Developer Panel
57. MAIN APPLICATION LAYOUT

Desktop:

+------------------------------------------------+

| HEADER                                         |

| Logo     Live Status       Profile       User  |

+------------------------------------------------+

|                                                |

| SIDEBAR       MAIN CONTENT                     |

|                                                |

| Dashboard                                      |

| Live                                           |

| Trigger                                        |

| Overlay                                        |

| Asset                                          |

| Plugin                                         |

| Setting                                        |

|                                                |

+------------------------------------------------+

| STATUS BAR                                     |

+------------------------------------------------+

58. APPLICATION HEADER
Components
Logo

Maulfinity

Position:

Left

Live Status

Example:

Connected:

🟢 TikTok Connected

Disconnected:

🔴 Offline
Profile Selector

Example:

Current Profile:

[GTA Stream ▼]

User Account

Display:

Avatar
Username
License status
59. SIDEBAR

Menu:

🏠 Dashboard

📡 Live Center

⚡ Triggers

🎮 Actions

🎨 Overlay Studio

📦 Assets

🔌 Plugins

👤 Profiles

📊 Analytics

⚙ Settings

60. DASHBOARD PAGE

Purpose:

Monitoring semua aktivitas.

Layout:

+-----------------------------+

LIVE STATUS

TikTok
YouTube

+-----------------------------+

EVENT MONITOR

Gift
Comment
Follow

+-----------------------------+

ACTIVE TRIGGERS

+-----------------------------+

SYSTEM

CPU
RAM
Connection

+-----------------------------+

61. LIVE CENTER PAGE

Purpose:

Mengatur koneksi.

Layout:

Platform


[TikTok]

Username:

___________


[CONNECT]


Status:

CONNECTED


Recent Events:


Gift Rose

Follow

Comment


62. EVENT MONITOR

Real-time console.

Example:

10:31:22

USER:
Gomaul


EVENT:
Gift


ITEM:
Rose


VALUE:
1



Filter:

Platform
Event type
User
63. TRIGGER STUDIO

Ini salah satu halaman terpenting.

Konsep:

Visual automation builder.

Layout:

------------------------------------------------

Trigger Name

[ Zombie Attack ]


------------------------------------------------

EVENT


WHEN:

Gift


VALUE:

Lion


------------------------------------------------


CONDITION


IF:

Coin > 10


------------------------------------------------


ACTION


+

Keyboard


+

Overlay


+

Sound


------------------------------------------------


SAVE


64. ACTION BUILDER

User memilih:

Add Action

|

├ Keyboard

├ WebSocket

├ OBS

├ Overlay

├ Sound

├ TTS

└ Plugin

65. OVERLAY STUDIO

Ini fitur pembeda Maulfinity.

Konsep:

Mini Canva untuk streamer.

Layout:

-------------------------------------------------

Toolbar

Image Text Video Widget Animation


-------------------------------------------------

                 Canvas


             [Overlay Area]



-------------------------------------------------

Properties Panel


Position

Size

Animation

Trigger

-------------------------------------------------

66. OVERLAY OBJECT SYSTEM

Setiap object punya:

Name

Position

Size

Layer

Animation

Trigger

Visibility


Example:

Object:

Gift Rose Animation

Trigger:

gift.rose


Animation:

bounce


Duration:

3s

67. ASSET MANAGER

Layout:

Assets


Images

Videos

Sounds

Templates


[Preview]


Import

Delete

Rename


Support:

Drag & Drop:

Folder → Maulfinity

68. PROFILE MANAGER

Purpose:

Satu PC bisa punya banyak setup.

Example:

Profile:


GTA Chaos Stream


Minecraft Survival


Roblox Funny Stream


Profile menyimpan:

Triggers

Overlay

OBS

Plugins

Settings

69. PLUGIN MANAGER

Layout:

Installed Plugin


GTA Controller

Version 1.0


Status:

Enabled


Permission:

Keyboard

Network


70. SETTINGS PAGE

Kategori:

General

Appearance

Account

Live Platform

OBS

Audio

TTS

Plugins

Storage

Update

Security

71. NOTIFICATION SYSTEM

Contoh:

Success:

✓ TikTok Connected

Warning:

⚠ OBS not detected

Error:

✕ Plugin failed
72. RESPONSIVE BEHAVIOR

Target:

Desktop.

Minimum:

1280x720

Recommended:

1920x1080

Layout rules:

Tidak boleh:

horizontal scroll
panel keluar layar
73. COMPONENT LIBRARY

React Components:

Layout
AppLayout

Sidebar

Header

Panel

Card

Modal

Data Display
EventCard

StatusBadge

LogViewer

StatsCard

Editor
Node

Canvas

LayerPanel

PropertyPanel

Timeline

74. ANIMATION GUIDELINE

Style:

Smooth.

Duration:

Small:

150ms

Normal:

300ms

Large:

500ms

Gunakan:

Fade
Slide
Scale

Hindari:

Terlalu banyak flashy animation
Mengganggu workflow
75. ACCESSIBILITY

Support:

Keyboard navigation
Font scaling
Clear contrast
76. FUTURE UI FEATURE

Versi berikut:

AI Overlay Generator

User:

"buat overlay GTA lucu"

AI:

Generate:

Layout
Animation
Asset placement
Marketplace

User bisa:

Download overlay
Download plugin
Download template
77. UI DEVELOPMENT RULE

Untuk Freebuff:

RULE:

All UI components must be reusable.

Do not create page-specific duplicated components.

Use design tokens.

Use TypeScript interfaces.

Every page must have loading/error/empty state.

Keep business logic outside components.

END PART 5