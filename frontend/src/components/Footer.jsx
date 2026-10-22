import React from 'react';
import { Mail, MessageCircle, Send, Shield, Headphones, ExternalLink } from 'lucide-react';

export default function Footer() {
  const socialLinks = [
    {
      name: 'تیلیگرام',
      sub: 'KurdishOMR',
      url: 'https://t.me/KurdishOMR',
      color: 'from-sky-500/20 to-blue-600/20 border-sky-500/30 text-sky-400 hover:border-sky-400',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.197 1.006.128.832.932z"/>
        </svg>
      ),
    },
    {
      name: 'وەتسئاپ',
      sub: 'HarmanGaraway',
      url: 'https://wa.me/HarmanGaraway?s=p',
      color: 'from-emerald-500/20 to-teal-600/20 border-emerald-500/30 text-emerald-400 hover:border-emerald-400',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
    },
    {
      name: 'ئینستاگرام',
      sub: '@kurdistanstudentchamption',
      url: 'https://www.instagram.com/kurdistanstudentchamption?exln=MXF5OTNqc2kyOXMxNA%3D%3D&utm_source=qr',
      color: 'from-pink-500/20 to-purple-600/20 border-pink-500/30 text-pink-400 hover:border-pink-400',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
    },
    {
      name: 'تیکتۆک',
      sub: '@ksc7813',
      url: 'https://www.tiktok.com/@ksc7813?_r=1&_t=ZS-9Ah4ZDSHRA4',
      color: 'from-cyan-500/20 to-rose-600/20 border-cyan-500/30 text-cyan-300 hover:border-cyan-400',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      ),
    },
    {
      name: 'سناپچات',
      sub: '@ksc_edu',
      url: 'https://www.snapchat.com',
      color: 'from-yellow-400/20 to-amber-500/20 border-yellow-400/30 text-yellow-300 hover:border-yellow-400',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.016 2.013c-3.79 0-6.108 2.502-6.108 5.767 0 1.09.28 2.213.67 3.012.18.368.21.57.06.82-.18.3-.59.51-.88.66-.43.22-.9.41-1.34.66-.6.34-.84.77-.84 1.34 0 .97.86 1.62 1.76 1.83.47.11.96.12 1.44.15.35.02.5.15.54.49.07.61.27 1.15.7 1.6.58.6 1.38.86 2.18.99.37.06.67.2.82.55.22.52.62.8 1.18.8h.04c.56 0 .96-.28 1.18-.8.15-.35.45-.49.82-.55.8-.13 1.6-.39 2.18-.99.43-.45.63-.99.7-1.6.04-.34.19-.47.54-.49.48-.03.97-.04 1.44-.15.9-.21 1.76-.86 1.76-1.83 0-.57-.24-1-.84-1.34-.44-.25-.91-.44-1.34-.66-.29-.15-.7-.36-.88-.66-.15-.25-.12-.452.06-.82.39-.799.67-1.922.67-3.012 0-3.265-2.318-5.767-6.108-5.767z" />
        </svg>
      ),
    },
    {
      name: 'ئیمەیڵی فەرمی',
      sub: 'studentchamption@gmail.com',
      url: 'mailto:studentchamption@gmail.com',
      color: 'from-amber-500/20 to-orange-600/20 border-amber-500/30 text-amber-400 hover:border-amber-400',
      icon: <Mail className="w-5 h-5" />,
    },
  ];

  return (
    <footer className="border-t border-slate-800/80 bg-[#060a14] pt-12 pb-8 px-4 sm:px-8 mt-12 text-right" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Support Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/60">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Headphones className="w-4 h-4 text-amber-400" />
              <span>تیمی پشتگیری و پەیوەندی</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              لەگەڵ ئێمە لە پەیوەندیدا بن بۆ هەر پرسیار و هاوکارییەک
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              تیمی تەکنیکی و کارگێڕیی پڕۆژەی KSC بەردەوام ئامادەن بۆ وەڵامدانەوەی سەرجەم داواکاری و ڕێنماییەکان.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>پشتگیری بەردەستە (24/7 Support)</span>
          </div>
        </div>

        {/* Social Accounts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {socialLinks.map((item, idx) => (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center gap-3.5 p-3.5 rounded-2xl bg-gradient-to-br ${item.color} border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
            >
              <div className="p-2.5 rounded-xl bg-slate-900/80 shrink-0 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                  {item.name}
                </span>
                <span className="block text-[11px] text-slate-400 truncate font-mono mt-0.5" dir="ltr">
                  {item.sub}
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </a>
          ))}
        </div>

        {/* Copyright & Disclaimer (No visible admin links) */}
        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} پلاتفۆرمی فەرمیی پێشبڕکێی قوتابییانی کوردستان (KSC) • هەموو مافەکان پارێزراون</p>
          <div className="flex items-center gap-2 text-slate-400">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>سیستەمی پارێزراوی نیشتمانی بۆ هەڵسەنگاندنی ئەنجامەکان</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
