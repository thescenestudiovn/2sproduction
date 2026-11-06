// Cloudflare Pages Function: POST /api/inquiry
// Tiếp nhận yêu cầu báo giá từ khách hàng, lưu vào Cloudflare KV và gửi email thông báo thật đến Ban Điều Hành 2S PRODUCTION

const INQUIRIES_KEY = '2SPRODUCTION_INQUIRIES_LIST';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json();
    const { company, name, phone, email, service, note, time } = data;

    if (!company || !name || !phone) {
      return new Response(JSON.stringify({ error: 'Vui lòng điền đầy đủ Tên công ty, Người liên hệ và Số điện thoại' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const timestamp = time || new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const targetEmail = data.targetEmail || env.ADMIN_EMAIL || '2splannervn@gmail.com';

    // 1. LƯU VÀO CLOUDFLARE KV (NẾU CÓ BINDING CMS_KV)
    if (env.CMS_KV) {
      try {
        const rawExisting = await env.CMS_KV.get(INQUIRIES_KEY);
        const list = rawExisting ? JSON.parse(rawExisting) : [];
        list.unshift({
          id: `inq_${Date.now()}`,
          company,
          name,
          phone,
          email,
          service,
          note,
          time: timestamp,
          createdAt: new Date().toISOString()
        });
        // Giữ tối đa 500 yêu cầu gần nhất
        await env.CMS_KV.put(INQUIRIES_KEY, JSON.stringify(list.slice(0, 500)));
      } catch (kvErr) {
        console.error('Lỗi lưu KV:', kvErr);
      }
    }

    // 2. GỬI EMAIL THẬT ĐẾN ADMIN QUA RESEND API HOẶC WEB3FORMS
    let emailSent = false;
    let emailProvider = 'none';

    // A. Thử gửi qua Resend API nếu có cấu hình RESEND_API_KEY
    if (env.RESEND_API_KEY) {
      try {
        const emailHtml = `
          <div style="font-family:'Segoe UI',Roboto,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06)">
            <div style="background:#0E1722;padding:24px 30px;border-bottom:3px solid #D6B779">
              <span style="color:#D6B779;font-size:0.75rem;letter-spacing:2px;font-weight:800;text-transform:uppercase">2S PRODUCTION • YÊU CẦU BÁO GIÁ MỚI</span>
              <h1 style="color:#FFFFFF;font-size:1.4rem;margin:8px 0 0;font-weight:800">Thông Báo Yêu Cầu Sự Kiện Từ Website</h1>
            </div>
            <div style="padding:28px 30px;color:#1E293B;font-size:0.95rem;line-height:1.6">
              <p style="margin:0 0 18px">Ban Điều Hành 2S PRODUCTION vừa nhận được một yêu cầu tư vấn & báo giá mới từ khách hàng doanh nghiệp:</p>
              
              <table style="width:100%;border-collapse:collapse;margin:18px 0;background:#F8FAFC;border-radius:8px;overflow:hidden">
                <tbody>
                  <tr style="border-bottom:1px solid #E2E8F0">
                    <td style="padding:12px 16px;font-weight:700;color:#64748B;width:150px">🏢 Công Ty:</td>
                    <td style="padding:12px 16px;font-weight:800;color:#0F172A;font-size:1.05rem">${company}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #E2E8F0">
                    <td style="padding:12px 16px;font-weight:700;color:#64748B">👤 Người Liên Hệ:</td>
                    <td style="padding:12px 16px;font-weight:700;color:#0F172A">${name}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #E2E8F0">
                    <td style="padding:12px 16px;font-weight:700;color:#64748B">📞 Số Điện Thoại:</td>
                    <td style="padding:12px 16px;font-weight:800;color:#0068FF">
                      <a href="tel:${phone}" style="color:#0068FF;text-decoration:none">${phone}</a>
                      &nbsp;|&nbsp;
                      <a href="https://zalo.me/${phone.replace(/[^0-9]/g, '')}" style="color:#0068FF;text-decoration:none" target="_blank">Chat Zalo ↗</a>
                    </td>
                  </tr>
                  <tr style="border-bottom:1px solid #E2E8F0">
                    <td style="padding:12px 16px;font-weight:700;color:#64748B">✉️ Email Khách:</td>
                    <td style="padding:12px 16px">
                      <a href="mailto:${email}" style="color:#0F172A;text-decoration:none">${email || 'Chưa cung cấp'}</a>
                    </td>
                  </tr>
                  <tr style="border-bottom:1px solid #E2E8F0">
                    <td style="padding:12px 16px;font-weight:700;color:#64748B">🎯 Dịch Vụ:</td>
                    <td style="padding:12px 16px;font-weight:700;color:#8C6B28">${service || 'Tư vấn tổng thể'}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px;font-weight:700;color:#64748B;vertical-align:top">📝 Yêu Cầu / Ghi Chú:</td>
                    <td style="padding:12px 16px;color:#1E293B;white-space:pre-wrap;line-height:1.7">${note || 'Không có ghi chú thêm'}</td>
                  </tr>
                </tbody>
              </table>

              <div style="background:#FFFBF0;border:1px solid rgba(140,107,40,0.3);border-radius:6px;padding:14px 18px;margin-top:20px;font-size:0.85rem;color:#78350F">
                ⏱️ Thời gian gửi: <strong>${timestamp}</strong> qua website <strong>2Sproduction.com</strong>
              </div>
            </div>
            <div style="background:#F1F5F9;padding:16px 30px;font-size:0.75rem;color:#64748B;text-align:center">
              2S PRODUCTION • Công Ty TNHH 2S Planner • Đà Nẵng, Việt Nam
            </div>
          </div>
        `;

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: env.EMAIL_FROM || '2S Production Concierge <onboarding@resend.dev>',
            to: [targetEmail],
            reply_to: email || undefined,
            subject: `[YÊU CẦU BÁO GIÁ MỚI] ${company} - ${name} (${phone})`,
            html: emailHtml
          })
        });

        if (resendRes.ok) {
          emailSent = true;
          emailProvider = 'resend';
        } else {
          console.error('Resend error:', await resendRes.text());
        }
      } catch (err) {
        console.error('Lỗi gọi Resend API:', err);
      }
    }

    // B. Thử gửi qua Web3Forms nếu có cấu hình WEB3FORMS_KEY
    if (!emailSent && env.WEB3FORMS_KEY) {
      try {
        const w3Res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_key: env.WEB3FORMS_KEY,
            subject: `[YÊU CẦU BÁO GIÁ MỚI] ${company} - ${name}`,
            from_name: '2S Production Website',
            to_email: targetEmail,
            company,
            name,
            phone,
            email,
            service,
            message: note,
            timestamp
          })
        });
        if (w3Res.ok) {
          emailSent = true;
          emailProvider = 'web3forms';
        }
      } catch (err) {
        console.error('Lỗi gọi Web3Forms API:', err);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      emailSent,
      emailProvider,
      message: emailSent
        ? `Đã tiếp nhận yêu cầu và gửi email thông báo tới ${targetEmail} thành công!`
        : `Đã tiếp nhận và lưu yêu cầu vào hệ thống quản trị của 2S PRODUCTION!`
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET /api/inquiry -> Lấy danh sách yêu cầu từ Cloudflare KV cho trang Admin
export async function onRequestGet(context) {
  const { env } = context;
  if (!env.CMS_KV) {
    return new Response(JSON.stringify({ inquiries: [] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const raw = await env.CMS_KV.get(INQUIRIES_KEY);
  return new Response(raw || JSON.stringify([]), {
    headers: { 'Content-Type': 'application/json' }
  });
}
