import React, { useState } from 'react';

export const COMPANY_INFO = {
  domain: '2Sproduction.com',
  brandName: '2S PRODUCTION',
  brandTagline: 'A Corporate Event & Production Brand',
  legalNameVi: 'CÔNG TY TNHH 2S PLANNER',
  legalNameEn: '2S PLANNER CO., LTD',
  enterpriseId: '0402294649',
  email: '2splannervn@gmail.com',
  addressVi: '91 Trần Thanh Mại, Phường An Hải, Thành phố Đà Nẵng, Việt Nam',
  addressEn: '91 Tran Thanh Mai, An Hai Ward, Da Nang City, Vietnam'
};

export default function App() {
  const [lang, setLang] = useState('vi');
  const isVi = lang === 'vi';

  return (
    <div>
      <header className="ystg-nav">
        <div className="container ystg-nav-inner">
          <a href="#" className="ystg-logo">
            <div className="ystg-logo-mark">2S</div>
            <div>
              <span className="ystg-logo-text">{COMPANY_INFO.brandName}</span>
              <span className="ystg-logo-sub">{COMPANY_INFO.domain} • BY 2S PLANNER CO., LTD</span>
            </div>
          </a>
          <ul className="ystg-menu">
            <li><a href="#about">{isVi ? 'Về 2S Production' : 'About Us'}</a></li>
            <li><a href="#services">{isVi ? 'Dịch Vụ & Nhiếp Ảnh' : 'Services'}</a></li>
            <li><a href="#work">{isVi ? 'Dự Án Thực Hiện' : 'Our Work'}</a></li>
            <li><a href="#markets">{isVi ? 'Thị Trường' : 'Markets'}</a></li>
            <li><a href="#contact">{isVi ? 'Liên Hệ' : 'Contact Us'}</a></li>
          </ul>
          <div className="ystg-nav-right">
            <button
              type="button"
              className="lang-switch"
              onClick={() => setLang(isVi ? 'en' : 'vi')}
            >
              🌐 {isVi ? 'VI / EN' : 'EN / VI'}
            </button>
            <a href="#contact" className="btn-ystg btn-ystg-white btn-ystg-sm">
              {isVi ? 'Nhận Báo Giá / Hồ Sơ Năng Lực' : 'Free Quote'}
            </a>
          </div>
        </div>
      </header>
    </div>
  );
}
