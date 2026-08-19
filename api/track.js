// api/track.js
module.exports = async function handler(req, res) {
  // Chỉ cho phép phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 1. Lấy thông tin người dùng
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const url = req.body.url || '/';

  // 2. Lấy biến môi trường (Sẽ cấu hình ở Bước 4)
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  // 3. Gọi API của Supabase để lưu dữ liệu (Dùng fetch có sẵn, không cần cài npm)
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/visitors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal' // Không cần trả về dữ liệu vừa insert
      },
      body: JSON.stringify({ 
        ip: ip, 
        user_agent: userAgent, 
        url: url 
      })
    });

    if (!response.ok) {
      throw new Error('Lỗi khi lưu vào Supabase');
    }

    // Phản hồi thành công
    res.status(200).json({ success: true, message: 'Đã theo dõi!' });
  } catch (error) {
    console.error('Lỗi tracking:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};