# Design Prompt — Telegram-Clone Yangi Funksiyalar

## Umumiy dizayn yo'nalishi
Modern messaging app UI (Telegram-style).
Asosiy rang: Telegram blue (#0088CC)
Dark/light mode support
Minimal iOS/Material hybrid uslub
Rounded corners: 12-16px
Soft shadows

---

## 1. TIMEZONE INDICATOR

Design a small timezone/status badge component for a messaging app.

Placement: under the contact's name in the chat header, next to the 
online status dot.

Content: local time (e.g. "03:24") + status emoji 
(sleeping icon for hours 23:00-07:00, sun icon for active hours).

Style: subtle gray text, 12px font size, rounded pill background 
(light gray in light mode, dark gray in dark mode), minimal padding 
(4px 8px), no border, soft opacity for secondary information hierarchy.

---

## 2. SMART REPLY SUGGESTIONS

Design a horizontal scrollable row of quick-reply suggestion buttons 
for a chat interface.

Placement: directly above the message input bar, appears only when 
a new incoming message is received.

Content: 2-3 short pill-shaped buttons with suggested reply text 
(e.g. "Ha, albatta", "Bilmayman", "Keyinroq gaplashamiz").

Style: light blue outline (#0088CC), white/transparent background, 
14px medium-weight text, rounded full pill shape (border-radius 20px), 
8px gap between pills, subtle fade-in + slide-up animation on appear, 
fade-out animation when user starts typing manually or sends a message.

---

## 3. MESSAGE CONTEXT REMINDER

Design an inline reminder suggestion card that appears below a chat 
message containing time-related keywords (e.g. "call me tomorrow at 5").

Placement: directly beneath the relevant message bubble, left-aligned 
if incoming, right-aligned if outgoing.

Content: calendar icon + text "Eslatma qo'shish?" + dismiss (X) 
button on the right.

Style: soft cream/light-yellow background (#FFF8E1 in light mode, 
muted dark-yellow in dark mode), rounded corners (12px), subtle 
shadow, compact height (~40px), calendar icon in Telegram blue, 
dismiss icon in light gray, tap interaction opens a date/time picker 
modal.

---

## UMUMIY STYLE GUIDE

Primary color: #0088CC (Telegram blue)
Success/positive accent: #4CAF50
Warning/reminder accent: #FFC107
Border radius: 12-16px (cards), 20px+ (pills/buttons)
Font: System default (SF Pro / Roboto), sizes 12-14px for secondary UI
Shadow: soft, low-opacity — 0 2px 8px rgba(0,0,0,0.08)
Dark mode backgrounds: #1C1C1E / #2C2C2E, accent colors qoladi bir xil
Animation: fade-in/slide-up (200-300ms ease-out) barcha yangi UI elementlar uchun
