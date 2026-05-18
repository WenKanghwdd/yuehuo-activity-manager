// 预设活动图片（SVG 占位图）
export const PRESET_IMAGES: { name: string; data: string }[] = [
  {
    name: '太极',
    data: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="#e8f5e9"/><circle cx="40" cy="40" r="18" fill="#43a047" opacity="0.3"/><circle cx="40" cy="40" r="10" fill="#43a047" opacity="0.5"/><circle cx="80" cy="40" r="18" fill="#43a047" opacity="0.3"/><text x="60" y="72" text-anchor="middle" font-size="10" fill="#2e7d32">太极</text></svg>`),
  },
  {
    name: '唱歌',
    data: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="#fff3e0"/><circle cx="60" cy="35" r="15" fill="#ef6c00" opacity="0.4"/><text x="60" y="40" text-anchor="middle" font-size="18" fill="#e65100">♪</text><text x="60" y="72" text-anchor="middle" font-size="10" fill="#e65100">合唱</text></svg>`),
  },
  {
    name: '手工',
    data: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="#fce4ec"/><rect x="40" y="20" width="40" height="30" rx="3" fill="#e91e63" opacity="0.4"/><circle cx="60" cy="35" r="8" fill="#c2185b" opacity="0.3"/><text x="60" y="72" text-anchor="middle" font-size="10" fill="#c2185b">手工</text></svg>`),
  },
  {
    name: '运动',
    data: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="#e3f2fd"/><circle cx="45" cy="35" r="12" fill="#1565c0" opacity="0.3"/><circle cx="75" cy="35" r="12" fill="#1565c0" opacity="0.3"/><circle cx="60" cy="50" r="8" fill="#1565c0" opacity="0.4"/><text x="60" y="72" text-anchor="middle" font-size="10" fill="#0d47a1">运动</text></svg>`),
  },
  {
    name: '户外',
    data: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="#e8f5e9"/><rect x="50" y="25" width="20" height="25" fill="#2e7d32" opacity="0.5"/><polygon points="40,50 80,50 60,25" fill="#1b5e20" opacity="0.3"/><text x="60" y="72" text-anchor="middle" font-size="10" fill="#1b5e20">户外</text></svg>`),
  },
  {
    name: '棋牌',
    data: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="#fff8e1"/><rect x="35" y="20" width="50" height="36" rx="4" fill="#ff8f00" opacity="0.3"/><circle cx="48" cy="30" r="3" fill="#ff6f00"/><circle cx="72" cy="38" r="3" fill="#ff6f00"/><circle cx="60" cy="46" r="3" fill="#ff6f00"/><text x="60" y="72" text-anchor="middle" font-size="10" fill="#e65100">棋牌</text></svg>`),
  },
  {
    name: '园艺',
    data: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="#f1f8e9"/><circle cx="60" cy="30" r="12" fill="#66bb6a" opacity="0.5"/><rect x="56" y="40" width="8" height="18" fill="#795548" opacity="0.5"/><text x="60" y="72" text-anchor="middle" font-size="10" fill="#33691e">园艺</text></svg>`),
  },
  {
    name: '讲座',
    data: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="#f3e5f5"/><rect x="30" y="25" width="60" height="30" rx="2" fill="#7b1fa2" opacity="0.3"/><text x="60" y="44" text-anchor="middle" font-size="10" fill="#4a148c">讲座</text><text x="60" y="72" text-anchor="middle" font-size="10" fill="#4a148c">文娱</text></svg>`),
  },
];
