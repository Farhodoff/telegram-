require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-telegram-clone-key';

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Telegram Clone Backend is running with SQLite' });
});

// Soxta ma'lumotlar bazasi (Xotirada faqat SMS kodlar uchun)
const mockDb = { codes: {} };

app.post('/api/auth/send-code', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Telefon raqam majburiy' });
  
  const code = "11111"; 
  mockDb.codes[phone] = code;

  console.log(`\n📲 SMS YUBORILDI: ${phone} raqamiga tasdiqlash kodi -> ${code}\n`);
  res.json({ success: true, message: 'SMS yuborildi' });
});

app.post('/api/auth/verify-code', (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: 'Telefon va kod majburiy' });

  if (mockDb.codes[phone] === code) {
    delete mockDb.codes[phone];
    
    // Check if user exists in DB
    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    let isNewUser = false;
    
    if (!user) {
      const stmt = db.prepare('INSERT INTO users (phone) VALUES (?)');
      const info = stmt.run(phone);
      user = { id: info.lastInsertRowid, phone: phone };
      isNewUser = true;
      console.log(`[+] Yangi foydalanuvchi yaratildi: ${phone}`);
    }

    const token = jwt.sign({ id: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '30d' });

    return res.json({ 
      success: true, 
      token,
      user,
      isNewUser
    });
  } else {
    return res.status(400).json({ error: 'Kod xato' });
  }
});

// Middleware for auth
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.status(401).json({ error: 'Token topilmadi' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token yaroqsiz' });
    req.user = user;
    next();
  });
};

app.get('/api/users/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ success: true, user });
});

app.put('/api/users/me', authenticateToken, (req, res) => {
  const { name, username, bio, avatar } = req.body;
  
  try {
    const stmt = db.prepare(`
      UPDATE users 
      SET name = COALESCE(?, name), 
          username = COALESCE(?, username), 
          bio = COALESCE(?, bio), 
          avatar = COALESCE(?, avatar)
      WHERE id = ?
    `);
    stmt.run(name, username, bio, avatar, req.user.id);
    
    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(400).json({ error: 'Xatolik yuz berdi (Balki username banddir)' });
  }
});

app.get('/api/users/:phoneOrUsername', authenticateToken, (req, res) => {
  const param = req.params.phoneOrUsername;
  const user = db.prepare('SELECT id, phone, name, username, bio, avatar, last_seen FROM users WHERE phone = ? OR username = ?').get(param, param);
  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  }
});

// Barcha chatlar ro'yxatini olish (Hozirgi foydalanuvchi ishtirok etgan barcha chatlar va ularning oxirgi xabari)
app.get('/api/chats', authenticateToken, (req, res) => {
  const currentUserId = req.user.id;
  try {
    // Har bir suhbatdosh bilan bo'lgan eng oxirgi xabarni olib keladigan so'rov
    const query = `
      SELECT 
        u.id as contact_id, 
        u.name as contact_name, 
        u.phone as contact_phone,
        u.avatar as contact_avatar,
        u.last_seen as contact_last_seen,
        m.id as last_msg_id,
        m.text as last_msg_text,
        m.media_url as last_msg_media,
        m.message_type as last_msg_type,
        m.created_at as last_msg_time,
        m.sender_id as last_msg_sender_id,
        (SELECT COUNT(*) FROM messages 
         WHERE sender_id = u.id AND recipient_id = ? AND is_read = 0) as unread_count
      FROM users u
      JOIN messages m ON (m.sender_id = u.id OR m.recipient_id = u.id)
      WHERE u.id != ? 
        AND m.id = (
          SELECT MAX(id) 
          FROM messages 
          WHERE (sender_id = u.id AND recipient_id = ?) 
             OR (sender_id = ? AND recipient_id = u.id)
        )
      ORDER BY m.created_at DESC
    `;
    const chats = db.prepare(query).all(currentUserId, currentUserId, currentUserId, currentUserId);
    res.json({ success: true, chats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
  }
});

// Ma'lum bir suhbatdosh bilan xabarlar tarixini olish
app.get('/api/messages/:contactId', authenticateToken, (req, res) => {
  const currentUserId = req.user.id;
  const contactId = req.params.contactId;

  try {
    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE (sender_id = ? AND recipient_id = ?) 
         OR (sender_id = ? AND recipient_id = ?)
      ORDER BY created_at ASC
    `).all(currentUserId, contactId, contactId, currentUserId);

    // O'qilgan deb belgilash (faqat ghost mode o'chiq bo'lsa)
    if (req.query.ghost !== 'true') {
      db.prepare('UPDATE messages SET is_read = 1 WHERE sender_id = ? AND recipient_id = ?').run(contactId, currentUserId);
    }

    res.json({ success: true, messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
  }
});

// Barcha faol foydalanuvchilar: userId -> socket.id
const connectedUsers = {};

io.on('connection', (socket) => {
  console.log('Yangi ulanish:', socket.id);

  socket.on('register_user', (data) => {
    if (data && data.token) {
      try {
        const decoded = jwt.verify(data.token, JWT_SECRET);
        connectedUsers[decoded.id] = socket.id;
        socket.userId = decoded.id;
        socket.phone = decoded.phone;
        
        // Update last_seen
        db.prepare('UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(decoded.id);
        console.log(`[+] Socket kirdi: User ID ${decoded.id} (${decoded.phone})`);
      } catch (err) {
        console.log('[-] Noto\'g\'ri token bilan ulanishga urinish');
      }
    }
  });

  socket.on('send_message', (data) => {
    // data: { chatId (phone hozircha), message: { text, ... } }
    if (!socket.userId) return;

    console.log(`[Message] ${socket.phone} dan xabar keldi:`, data.message.text);

    // Qabul qiluvchini topish
    const recipient = db.prepare('SELECT id, phone FROM users WHERE phone = ? OR username = ?').get(data.chatId, data.chatId);
    
    if (!recipient) {
      console.log('[-] Qabul qiluvchi topilmadi');
      return;
    }

    // Xabarni bazaga saqlash
    const stmt = db.prepare(`
      INSERT INTO messages (chat_id, sender_id, recipient_id, text, media_url, message_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    let mediaUrl = data.message.imageUrl || data.message.videoUrl || data.message.audioUrl || null;
    let messageType = 'text';
    if (data.message.imageUrl) messageType = 'image';
    if (data.message.videoUrl) messageType = 'video';
    if (data.message.audioUrl) messageType = 'audio';

    const info = stmt.run(data.chatId, socket.userId, recipient.id, data.message.text || '', mediaUrl, messageType);
    
    const savedMessage = {
      ...data.message,
      id: info.lastInsertRowid.toString(),
      senderId: socket.userId,
      isRead: false
    };

    // Qabul qiluvchiga yetkazish
    const recipientSocketId = connectedUsers[recipient.id];
    if (recipientSocketId) {
      // Haqiqiy qabul qiluvchi online
      io.to(recipientSocketId).emit('receive_message', {
        chatId: socket.phone, // qabul qiluvchi uchun chat id - bu yuboruvchining telefoni
        message: { ...savedMessage, sender: 'them' }
      });
      console.log(`[✓] Xabar ${recipient.phone} ga yuborildi`);
    } else {
      console.log(`[!] ${recipient.phone} offline. Baza ga saqlandi.`);
      
      // Hozirgi local-testlar uchun (o'zimga o'zim yozganda yoki echo qilish uchun qisman yordam)
      // Agar o'zimizga yuborayotgan bo'lsak:
      if (socket.phone === data.chatId) {
        socket.emit('receive_message', {
          chatId: data.chatId,
          message: { ...savedMessage, sender: 'them' }
        });
      }
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      db.prepare('UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(socket.userId);
      delete connectedUsers[socket.userId];
      console.log(`[-] Socket chiqdi: User ID ${socket.userId}`);
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portida ishga tushdi.`);
});
