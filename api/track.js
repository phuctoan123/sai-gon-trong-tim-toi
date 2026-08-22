// api/track.js
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for'] || 'unknown-ip';
  const userAgent = req.headers['user-agent'] || 'unknown-ua';
  const url = req.body?.url || '/';

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  // 1. Kiểm tra biến môi trường trước khi làm gì cả
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ LỖI: Thiếu biến môi trường SUPABASE trên Vercel!");
    return res.status(500).json({ 
      error: 'Lỗi cấu hình server'
    });
  }

  try {
    // 2. Gọi API của Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/visitors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal' // Không cần trả về dữ liệu vừa insert để nhẹ hơn
      },
      body: JSON.stringify({ 
        ip: ip, 
        user_agent: userAgent, 
        url: url 
      })
    });

    // 3. Xử lý nếu Supabase từ chối
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Supabase từ chối (${response.status}):`, errorText);
      throw new Error(`Supabase lỗi ${response.status}: ${errorText}`);
    }

    // 4. Thành công
    console.log("✅ Đã lưu lượt truy cập thành công");
    res.status(204).end();

  } catch (error) {
    console.error("❌ Lỗi khi lưu vào Supabase:", error.message);
    res.status(500).json({ 
      error: 'Lỗi server'
    });
  }
};
