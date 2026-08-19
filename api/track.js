// api/track.js
module.exports = async function handler(req, res) {
  // 1. Chỉ nhận POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 2. Lấy dữ liệu
  const ip = req.headers['x-forwarded-for'] || 'unknown-ip';
  const url = req.body?.url || '/';

  // 3. In ra log của Vercel để bạn biết nó đã chạy
  console.log(`✅ [TEST THÀNH CÔNG] Có người truy cập! IP: ${ip}, URL: ${url}`);

  // 4. Trả về thành công ngay lập tức (Không gọi Supabase)
  res.status(200).json({ 
    success: true, 
    message: 'Đã nhận dữ liệu thành công (Chế độ Test)',
    data: { ip, url }
  });
}