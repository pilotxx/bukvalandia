'use strict';
/* ============================================================
   Букваландия — рисование питомца (SVG)
   Питомец не увеличивается, а взрослеет: меняются пропорции (голова/тело),
   появляются лапки, ножки, черты лица. Мелкие шаги роста — по звёздам (PET_MICRO).
   ============================================================ */

/* Мелкие шаги роста: каждые ~10–15 звёзд появляется новая черта */
const PET_MICRO = [
  { at: 5, id: 'tooth', name: 'первый зубик' },
  { at: 10, id: 'tuft', name: 'хохолок' },
  { at: 15, id: 'freckles', name: 'веснушки' },
  { at: 20, id: 'tail', name: 'хвостик подлиннее' },
  { at: 35, id: 'shine', name: 'блеск в глазах' },
  { at: 45, id: 'spots', name: 'пятнышки' },
  { at: 55, id: 'claws', name: 'коготки' },
  { at: 65, id: 'brows', name: 'бровки' },
  { at: 95, id: 'tailtip', name: 'кисточка на хвосте' },
  { at: 110, id: 'mark', name: 'звёздочка на лбу' },
  { at: 130, id: 'fluff', name: 'пушистая грудка' },
  { at: 150, id: 'earpat', name: 'узор на ушках' },
  { at: 200, id: 'glow', name: 'сияющие глаза' },
];

const Pet = {
  shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = c => Math.max(0, Math.min(255, Math.round(c + (amt > 0 ? (255 - c) * amt : c * amt))));
    return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(x => x.toString(16).padStart(2, '0')).join('');
  },

  /* Пропорции по стадиям: голова (hy, hr), тело (by, bx, bb), глаза, лапки, ножки.
     Рост почти не меняется — меняется соотношение головы и тела. */
  GEO: [null,
    { hy: 94, hr: 50, by: 150, bx: 36, bb: 30, ey: 92, ed: 20, er: 15, pr: 10, arm: [8, 11], leg: 0, fy: 180, fr: [13, 8], fx: 18 },
    { hy: 80, hr: 45, by: 142, bx: 38, bb: 36, ey: 80, ed: 18, er: 13, pr: 8.5, arm: [9, 16], leg: 0, fy: 181, fr: [14, 8], fx: 19 },
    { hy: 70, hr: 41, by: 134, bx: 40, bb: 40, ey: 70, ed: 17, er: 11.5, pr: 7.5, arm: [9, 20], leg: 8, fy: 182, fr: [15, 8], fx: 20 },
    { hy: 63, hr: 39, by: 128, bx: 42, bb: 44, ey: 63, ed: 16, er: 10.5, pr: 7, arm: [10, 22], leg: 12, fy: 182, fr: [16, 8], fx: 21 },
  ],
  micro(grow) { const m = {}; PET_MICRO.forEach(x => { if ((grow || 0) >= x.at) m[x.id] = true; }); return m; },

  /* opts: species, color, stage (0..4), grow (звёзды), hat, glasses, neck (эмодзи или предмет), body, feet, back (предметы-одежда),
     mood ('happy'|'sad'|'wow'|'sleep'|'laugh'|'love'|'chew'), uid */
  svg(o) {
    const uid = o.uid || 'p' + Math.random().toString(36).slice(2, 7);
    let fill, dark, light, defs = '';
    if (o.color === 'rainbow') {
      defs = `<linearGradient id="${uid}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF6B9A"/><stop offset=".25" stop-color="#FFD34E"/><stop offset=".5" stop-color="#5ED6A0"/><stop offset=".75" stop-color="#6EC6FF"/><stop offset="1" stop-color="#B39DFF"/></linearGradient>`;
      fill = `url(#${uid}g)`; dark = '#8A6BE8'; light = '#FFFFFF';
    } else if (o.color === 'gold') {
      defs = `<linearGradient id="${uid}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF3B0"/><stop offset=".45" stop-color="#F5C542"/><stop offset="1" stop-color="#C98B12"/></linearGradient>`;
      fill = `url(#${uid}g)`; dark = '#B07A0C'; light = '#FFF6D0';
    } else {
      fill = o.color; dark = Pet.shade(o.color, -0.25); light = Pet.shade(o.color, 0.55);
    }
    if (o.stage === 0) return Pet.egg(o, fill, dark, defs, uid);

    const st = Math.max(1, Math.min(4, o.stage));
    const g = Pet.GEO[st], sp = o.species, m = Pet.micro(o.grow);
    const mood = o.mood || 'happy';
    const sw = 3.2;
    const S = (x) => x.toFixed(1);
    const cl = { body: o.body || null, feet: o.feet || null, back: o.back || null };
    let back = '', legs = '', bodyL = '', torso = '', arms = '', feet = '', head = '', face = '', top = '';

    /* ---------- Сзади: крылья, хвост, плащ, рюкзак ---------- */
    if (cl.back) back += Pet.backItem(cl.back, g, 'back', uid);
    const tailK = [0, 0.6, 0.8, 1, 1.1][st] * (m.tail ? 1.25 : 1);
    if (sp === 'dragon') {
      if (st >= 2) {
        const wk = [0, 0, 0.6, 0.85, 1.1][st];
        const wx = g.bx * 0.7, wy = g.by - g.bb * 0.45;
        back += `<g transform="translate(100 ${S(wy)}) scale(${wk})">
          <path d="M-${S(wx)} 0 Q-${S(wx + 48)} -46 -${S(wx + 42)} 8 Q-${S(wx + 30)} 2 -${S(wx + 24)} 18 Q-${S(wx + 16)} 6 -${S(wx - 4)} 14z" fill="${light}" stroke="${dark}" stroke-width="${sw}" stroke-linejoin="round"/>
          <path d="M${S(wx)} 0 Q${S(wx + 48)} -46 ${S(wx + 42)} 8 Q${S(wx + 30)} 2 ${S(wx + 24)} 18 Q${S(wx + 16)} 6 ${S(wx - 4)} 14z" fill="${light}" stroke="${dark}" stroke-width="${sw}" stroke-linejoin="round"/></g>`;
      }
      const tx = 100 + g.bx * 0.75, ty = g.by + g.bb * 0.55, L = 44 * tailK;
      back += `<path d="M${S(tx - 8)} ${S(ty - 10)} Q${S(tx + L)} ${S(ty + 4)} ${S(tx + L * 0.9)} ${S(ty - L * 0.85)} Q${S(tx + L * 0.7)} ${S(ty - 10)} ${S(tx - 6)} ${S(ty + 8)}z" fill="${fill}" stroke="${dark}" stroke-width="${sw}" stroke-linejoin="round"/>`;
      if (st >= 2 || m.tailtip) back += `<path d="M${S(tx + L * 0.9 - 6)} ${S(ty - L * 0.85)} l7 ${m.tailtip ? -16 : -11} l6 ${m.tailtip ? 17 : 12}z" fill="${dark}"/>`;
    }
    if (sp === 'cat') {
      const tx = 100 + g.bx * 0.8, ty = g.by + g.bb * 0.6, L = 50 * tailK;
      const d = `M${S(tx - 6)} ${S(ty)} Q${S(tx + L * 0.9)} ${S(ty - 4)} ${S(tx + L * 0.55)} ${S(ty - L)}`;
      back += `<path d="${d}" fill="none" stroke="${dark}" stroke-width="15" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="10" stroke-linecap="round"/>`;
      if (m.tailtip) back += `<circle cx="${S(tx + L * 0.55)}" cy="${S(ty - L)}" r="7" fill="${dark}"/>`;
    }
    if (sp === 'bunny') {
      const r = 10 * (m.tail ? 1.3 : 1) * (st >= 3 ? 1.1 : 1);
      back += `<circle cx="${S(100 + g.bx * 0.85)}" cy="${S(g.by + g.bb * 0.45)}" r="${S(r)}" fill="${light}" stroke="${dark}" stroke-width="${sw}"/>`;
      if (m.tailtip) back += `<circle cx="${S(100 + g.bx * 0.85)}" cy="${S(g.by + g.bb * 0.45)}" r="${S(r * 0.5)}" fill="#fff"/>`;
    }
    if (cl.body && cl.body.shape === 'hoodie') back += `<ellipse cx="100" cy="${S(g.hy + g.hr * 0.72)}" rx="${S(g.hr * 0.95)}" ry="${S(g.hr * 0.4)}" fill="${cl.body.c1}" stroke="${Pet.shade(cl.body.c1, -0.3)}" stroke-width="2.5"/>`;

    /* ---------- Ножки и ступни ---------- */
    [-1, 1].forEach(s => {
      const fx = 100 + s * g.fx;
      if (g.leg) legs += `<rect x="${S(fx - 7)}" y="${S(g.by + g.bb - 14)}" width="14" height="${S(g.fy - (g.by + g.bb - 14))}" rx="6" fill="${fill}" stroke="${dark}" stroke-width="${sw}"/>`;
      legs += `<ellipse cx="${S(fx + s * 2)}" cy="${g.fy}" rx="${g.fr[0]}" ry="${g.fr[1]}" fill="${fill}" stroke="${dark}" stroke-width="${sw}"/>`;
      if (m.claws && !cl.feet) legs += `<g fill="#fff" stroke="${dark}" stroke-width="1">${[-6, 0, 6].map(dx => `<path d="M${S(fx + s * 2 + dx - 2)} ${g.fy + 3} l2 4 l2 -4z"/>`).join('')}</g>`;
    });

    /* ---------- Тело ---------- */
    const bodyEl = `<ellipse cx="100" cy="${g.by}" rx="${g.bx}" ry="${g.bb}" fill="${fill}" stroke="${dark}" stroke-width="${sw}"/>`;
    bodyL += bodyEl + `<ellipse cx="100" cy="${S(g.by + g.bb * 0.15)}" rx="${S(g.bx * 0.6)}" ry="${S(g.bb * 0.62)}" fill="${light}" opacity=".85"/>`;
    if (m.spots) {
      if (sp === 'dragon') bodyL += `<g fill="${dark}" opacity=".3"><circle cx="${S(100 - g.bx * 0.62)}" cy="${S(g.by - g.bb * 0.1)}" r="4"/><circle cx="${S(100 + g.bx * 0.66)}" cy="${S(g.by + g.bb * 0.15)}" r="5"/><circle cx="${S(100 - g.bx * 0.5)}" cy="${S(g.by + g.bb * 0.5)}" r="3.5"/></g>`;
      if (sp === 'cat') bodyL += `<g stroke="${dark}" stroke-width="3" stroke-linecap="round" opacity=".35" fill="none"><path d="M${S(100 - g.bx * 0.9)} ${S(g.by - 6)} q8 4 12 0"/><path d="M${S(100 + g.bx * 0.9)} ${S(g.by - 6)} q-8 4 -12 0"/><path d="M${S(100 - g.bx * 0.85)} ${S(g.by + 8)} q8 4 12 0"/><path d="M${S(100 + g.bx * 0.85)} ${S(g.by + 8)} q-8 4 -12 0"/></g>`;
      if (sp === 'bunny') bodyL += `<ellipse cx="${S(100 - g.bx * 0.55)}" cy="${S(g.by - g.bb * 0.2)}" rx="9" ry="7" fill="#fff" opacity=".7"/>`;
    }
    if (cl.body) torso = Pet.bodyItem(cl.body, g, uid);
    if (m.fluff && !(cl.body && cl.body.cover)) bodyL += `<path d="M${S(100 - g.bx * 0.35)} ${S(g.by - g.bb * 0.62)} l6 9 l6 -8 l6 9 l6 -9 l6 9 l6 -8" fill="${light}" stroke="${light}" stroke-width="3" stroke-linejoin="round"/>`;

    /* ---------- Лапки (руки) ---------- */
    const armSleeve = cl.body && cl.body.sleeve;
    [-1, 1].forEach(s => {
      const ax = 100 + s * (g.bx - 3), ay = g.by - g.bb * 0.42;
      const [rx, ry] = g.arm;
      let a = `<ellipse cx="${S(ax)}" cy="${S(ay + ry - 2)}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${dark}" stroke-width="${sw}"/>`;
      if (armSleeve) {
        const c1 = cl.body.c1, len = armSleeve === 'full' ? ry * 1.55 : armSleeve === 'puff' ? ry * 0.7 : ry * 0.95;
        a += `<clipPath id="${uid}a${s}"><ellipse cx="${S(ax)}" cy="${S(ay + ry - 2)}" rx="${rx + 1}" ry="${ry + 1}"/></clipPath>
          <rect x="${S(ax - rx - 2)}" y="${S(ay - 4)}" width="${rx * 2 + 4}" height="${S(len)}" fill="${c1}" clip-path="url(#${uid}a${s})"/>`;
        if (armSleeve === 'puff') a += `<ellipse cx="${S(ax)}" cy="${S(ay + 3)}" rx="${rx + 3}" ry="${S(ry * 0.45)}" fill="${c1}" stroke="${Pet.shade(c1, -0.25)}" stroke-width="2"/>`;
        if (armSleeve === 'full' && cl.body.c2) a += `<rect x="${S(ax - rx)}" y="${S(ay + len - 8)}" width="${rx * 2}" height="5" fill="${cl.body.c2}" clip-path="url(#${uid}a${s})"/>`;
      }
      arms += `<g class="arm ${s < 0 ? 'arm-l' : 'arm-r'}" style="transform-origin:${S(ax)}px ${S(ay)}px">${a}</g>`;
    });

    /* ---------- Обувь ---------- */
    if (cl.feet) feet = Pet.feetItem(cl.feet, g);
    if (cl.back) feet += Pet.backItem(cl.back, g, 'front', uid);

    /* ---------- Голова: уши, рожки, голова, лицо ---------- */
    const hx = 100, hy = g.hy, hr = g.hr;
    if (sp === 'cat') {
      const e = s => `<path d="M${S(hx + s * hr * 0.88)} ${S(hy - hr * 0.3)} L${S(hx + s * hr * 0.78)} ${S(hy - hr * 1.28)} L${S(hx + s * hr * 0.12)} ${S(hy - hr * 0.86)}z" fill="${fill}" stroke="${dark}" stroke-width="${sw}" stroke-linejoin="round"/>
        <path d="M${S(hx + s * hr * 0.72)} ${S(hy - hr * 0.5)} L${S(hx + s * hr * 0.7)} ${S(hy - hr * 1.05)} L${S(hx + s * hr * 0.32)} ${S(hy - hr * 0.8)}z" fill="#FFB3C7"/>`
        + (m.earpat ? `<path d="M${S(hx + s * hr * 0.76)} ${S(hy - hr * 1.12)} l${s * -6} 3" stroke="${dark}" stroke-width="2.5" stroke-linecap="round"/>` : '');
      head += e(-1) + e(1);
    }
    if (sp === 'bunny') {
      const h = [0, 30, 40, 48, 54][st];
      const e = s => {
        const bx = hx + s * hr * 0.38, by = hy - hr * 0.78;
        return `<g transform="rotate(${s * 11} ${S(bx)} ${S(by)})"><ellipse cx="${S(bx)}" cy="${S(by - h / 2)}" rx="${S(hr * 0.24)}" ry="${S(h / 2 + 6)}" fill="${fill}" stroke="${dark}" stroke-width="${sw}"/>
          <ellipse cx="${S(bx)}" cy="${S(by - h / 2 + 2)}" rx="${S(hr * 0.12)}" ry="${S(h / 2 - 2)}" fill="#FFC2D4"/>
          ${m.earpat ? `<circle cx="${S(bx)}" cy="${S(by - h + 4)}" r="3.5" fill="${dark}" opacity=".45"/>` : ''}</g>`;
      };
      head += e(-1) + e(1);
    }
    if (sp === 'dragon') {
      const h = [0, 9, 14, 19, 24][st];
      const e = s => `<path d="M${S(hx + s * hr * 0.32)} ${S(hy - hr * 0.86)} Q${S(hx + s * hr * 0.42)} ${S(hy - hr * 0.86 - h)} ${S(hx + s * (hr * 0.62 + h * 0.4))} ${S(hy - hr * 0.88 - h)} Q${S(hx + s * hr * 0.58)} ${S(hy - hr * 0.74)} ${S(hx + s * hr * 0.6)} ${S(hy - hr * 0.68)}z" fill="#FFE7A3" stroke="${dark}" stroke-width="${sw}" stroke-linejoin="round"/>`
        + (m.earpat ? `<path d="M${S(hx + s * hr * 0.44)} ${S(hy - hr * 0.86 - h * 0.45)} l${s * 7} 1" stroke="${dark}" stroke-width="2" opacity=".6"/>` : '');
      head += e(-1) + e(1);
    }
    head += `<circle cx="${hx}" cy="${hy}" r="${hr}" fill="${fill}" stroke="${dark}" stroke-width="${sw}"/>`;
    if (sp === 'dragon' && st >= 2) head += `<path d="M${hx - 7} ${S(hy - hr + 3)} l7 -11 l7 11z" fill="${dark}"/>`;
    if (m.tuft) {
      if (sp === 'dragon') head += `<path d="M${hx - 14} ${S(hy - hr + 6)} l4 -9 l4 8 M${hx + 6} ${S(hy - hr + 6)} l4 -9 l4 8" fill="${dark}" stroke="${dark}" stroke-width="2" stroke-linejoin="round"/>`;
      else head += `<path d="M${hx - 6} ${S(hy - hr + 3)} q-4 -12 4 -14 M${hx} ${S(hy - hr + 2)} q2 -13 9 -12 M${hx + 5} ${S(hy - hr + 3)} q8 -9 12 -5" fill="none" stroke="${dark}" stroke-width="3.2" stroke-linecap="round"/>`;
    }
    if (m.spots && sp === 'cat') head += `<g stroke="${dark}" stroke-width="3" stroke-linecap="round" opacity=".35"><path d="M${hx} ${S(hy - hr + 4)} v10"/><path d="M${hx - 10} ${S(hy - hr + 7)} v8"/><path d="M${hx + 10} ${S(hy - hr + 7)} v8"/></g>`;
    if (m.mark) head += `<path transform="translate(${hx} ${S(hy - hr * 0.55)}) scale(.55)" d="M0 -12 L3.5 -4 L12 -3.7 L5.5 2 L7.5 10 L0 5.5 L-7.5 10 L-5.5 2 L-12 -3.7 L-3.5 -4z" fill="#FFD34E" stroke="#E0A800" stroke-width="2"/>`;

    /* Лицо */
    const ed = g.ed, ey = g.ey, er = g.er, pr = g.pr;
    const ink = '#2B2350';
    const iris = m.glow ? `<circle cx="0" cy="0" r="${S(pr + 2)}" fill="#3FB8AF" opacity=".9"/>` : '';
    const pup = (x, big) => `<g transform="translate(${S(x + (big ? 0 : (x < 100 ? 1.5 : -1.5)))} ${S(ey + (big ? 0 : 2))})">${iris}<circle r="${S(big ? pr * 1.08 : pr)}" fill="${ink}"/><circle cx="${S(pr * 0.38)}" cy="${S(-pr * 0.42)}" r="${S(pr * 0.38)}" fill="#fff"/>${m.shine ? `<circle cx="${S(-pr * 0.35)}" cy="${S(pr * 0.4)}" r="${S(pr * 0.18)}" fill="#fff"/>` : ''}</g>`;
    let eyes;
    if (mood === 'sleep' || mood === 'chew') {
      eyes = [-1, 1].map(s => `<path d="M${S(hx + s * ed - er * 0.8)} ${ey + 2} Q${S(hx + s * ed)} ${S(ey + 2 + er * 0.6)} ${S(hx + s * ed + er * 0.8)} ${ey + 2}" fill="none" stroke="${ink}" stroke-width="3.2" stroke-linecap="round"/>`).join('');
    } else if (mood === 'laugh') {
      eyes = [-1, 1].map(s => `<path d="M${S(hx + s * ed - er * 0.8)} ${ey + 4} Q${S(hx + s * ed)} ${S(ey - er * 0.7)} ${S(hx + s * ed + er * 0.8)} ${ey + 4}" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>`).join('');
    } else if (mood === 'love') {
      eyes = [-1, 1].map(s => `<path transform="translate(${S(hx + s * ed)} ${ey}) scale(${S(er / 12)})" d="M0 10 C-14 0 -12 -12 -4 -11 C-1 -11 0 -8 0 -6 C0 -8 1 -11 4 -11 C12 -12 14 0 0 10z" fill="#FF4F7A"/>`).join('');
    } else {
      const big = mood === 'wow';
      eyes = `<g class="pet-eyes">${[-1, 1].map(s => big
        ? `<circle cx="${hx + s * ed}" cy="${ey}" r="${S(er * 1.05)}" fill="#fff"/>`
        : `<ellipse cx="${hx + s * ed}" cy="${ey}" rx="${S(er * 0.86)}" ry="${er}" fill="#fff"/>`).join('')}
        <g class="pupils">${pup(hx - ed, big)}${pup(hx + ed, big)}</g>`
        + (st >= 4 && mood === 'happy' ? [-1, 1].map(s => `<path d="M${S(hx + s * ed - er * 0.9)} ${S(ey - er * 0.35)} Q${S(hx + s * ed)} ${S(ey - er * 1.25)} ${S(hx + s * ed + er * 0.9)} ${S(ey - er * 0.35)}z" fill="${fill}"/>`).join('') : '')
        + '</g>';
    }
    let brows = '';
    if (mood === 'sad') brows = [-1, 1].map(s => `<path d="M${S(hx + s * (ed + er * 0.9))} ${S(ey - er - 2)} Q${S(hx + s * ed)} ${S(ey - er - 4)} ${S(hx + s * (ed - er * 0.6))} ${S(ey - er - 9)}" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`).join('');
    else if ((st >= 3 || m.brows) && mood !== 'sleep') brows = [-1, 1].map(s => `<path d="M${S(hx + s * (ed + er * 0.8))} ${S(ey - er - 5)} Q${S(hx + s * ed)} ${S(ey - er - 10)} ${S(hx + s * (ed - er * 0.7))} ${S(ey - er - 6)}" fill="none" stroke="${dark}" stroke-width="3" stroke-linecap="round"/>`).join('');
    const my = hy + hr * 0.42;
    let mouth;
    if (mood === 'sad') mouth = `<path d="M${hx - 9} ${S(my + 5)} Q${hx} ${S(my - 3)} ${hx + 9} ${S(my + 5)}" fill="none" stroke="${ink}" stroke-width="3.2" stroke-linecap="round"/>`;
    else if (mood === 'wow') mouth = `<ellipse cx="${hx}" cy="${S(my + 2)}" rx="7" ry="8" fill="${ink}"/><ellipse cx="${hx}" cy="${S(my + 6)}" rx="4.5" ry="3.5" fill="#FF7A9A"/>`;
    else if (mood === 'sleep') mouth = `<ellipse cx="${hx}" cy="${S(my + 2)}" rx="4" ry="3" fill="${ink}" opacity=".7"/>`;
    else if (mood === 'laugh') mouth = `<path d="M${hx - 13} ${S(my - 2)} Q${hx} ${S(my + 20)} ${hx + 13} ${S(my - 2)}z" fill="${ink}"/><path d="M${hx - 7} ${S(my + 8)} Q${hx} ${S(my + 15)} ${hx + 7} ${S(my + 8)}" fill="#FF7A9A"/>`;
    else if (mood === 'chew') mouth = `<g class="chew"><ellipse cx="${hx}" cy="${S(my + 2)}" rx="8" ry="5" fill="${ink}"/></g>`;
    else mouth = `<path d="M${hx - 11} ${S(my - 3)} Q${hx} ${S(my + 11)} ${hx + 11} ${S(my - 3)}" fill="${ink}" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round"/><path d="M${hx - 6} ${S(my + 2)} Q${hx} ${S(my + 8)} ${hx + 6} ${S(my + 2)}" fill="#FF7A9A"/>`;
    if (m.tooth && (mood === 'happy' || mood === 'laugh' || mood === 'love')) mouth += `<rect x="${hx - 3}" y="${S(my - 3.5)}" width="6" height="5" rx="1.5" fill="#fff"/>`;
    let cheeks = `<ellipse cx="${S(hx - hr * 0.64)}" cy="${S(hy + hr * 0.3)}" rx="${S(hr * 0.17)}" ry="${S(hr * 0.11)}" fill="#FF8FAB" opacity=".55"/><ellipse cx="${S(hx + hr * 0.64)}" cy="${S(hy + hr * 0.3)}" rx="${S(hr * 0.17)}" ry="${S(hr * 0.11)}" fill="#FF8FAB" opacity=".55"/>`;
    if (m.freckles) cheeks += [-1, 1].map(s => `<g fill="${dark}" opacity=".45"><circle cx="${S(hx + s * hr * 0.58)}" cy="${S(hy + hr * 0.18)}" r="1.6"/><circle cx="${S(hx + s * hr * 0.7)}" cy="${S(hy + hr * 0.16)}" r="1.6"/><circle cx="${S(hx + s * hr * 0.64)}" cy="${S(hy + hr * 0.08)}" r="1.6"/></g>`).join('');
    if (sp === 'cat') cheeks += `<g stroke="${ink}" stroke-width="2" stroke-linecap="round" opacity=".5">${[-1, 1].map(s => `<path d="M${S(hx + s * hr * 0.5)} ${S(hy + hr * 0.38)} l${s * hr * 0.42} -4"/><path d="M${S(hx + s * hr * 0.5)} ${S(hy + hr * 0.48)} l${s * hr * 0.42} 3"/>`).join('')}</g>`;
    face = eyes + brows + cheeks + mouth;

    /* ---------- Аксессуары: шея, очки, головной убор ---------- */
    const em = (x, y, size, ch) => ch ? `<text x="${S(x)}" y="${S(y)}" font-size="${S(size)}" text-anchor="middle" dominant-baseline="central">${ch}</text>` : '';
    const it = v => v ? (typeof v === 'object' ? v : { icon: v }) : null;
    const hat = it(o.hat), gl = it(o.glasses), nk = it(o.neck);
    if (nk) top += nk.shape ? Pet.neckItem(nk, g) : em(hx, hy + hr * 0.98, hr * 0.8, nk.icon);
    if (gl) top += em(hx, ey + 2, hr * 1.18, gl.icon);
    if (hat) top += hat.shape ? Pet.hatItem(hat, g) : em(hx, hy - hr * 0.92, hr * 1.15, hat.icon);

    const aura = st >= 4 ? `<g class="pet-aura">${em(26, 40, 22, '✨')}${em(176, 60, 18, '✨')}${em(172, 168, 20, '✨')}${em(24, 160, 16, '✨')}</g>` : '';
    const set = o.setIcon ? `<g class="pet-aura">${em(30, 30, 24, o.setIcon)}${em(172, 34, 20, o.setIcon)}</g>` : '';

    return `<svg viewBox="0 0 200 200" class="pet-svg" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>
      <ellipse cx="100" cy="188" rx="${S(g.bx * 1.3)}" ry="7" fill="#000" opacity=".12"/>
      <g class="pet-body">${back}${legs}<g>${bodyL}</g>${torso}${arms}${feet}<g class="pet-head">${head}${face}${top}</g></g>${aura}${set}</svg>`;
  },

  /* ---------- Одежда на туловище: обрезается по фигуре, поэтому садится на любую стадию ---------- */
  bodyItem(c, g, uid) {
    const { by, bx, bb } = g;
    const c1 = c.c1, c2 = c.c2 || '#fff', dk = Pet.shade(c1, -0.3);
    const clip = `<clipPath id="${uid}t"><ellipse cx="100" cy="${by}" rx="${bx + 0.5}" ry="${bb + 0.5}"/></clipPath>`;
    const R = (y1, y2, col) => `<rect x="${100 - bx - 2}" y="${(by - bb + y1 * bb * 2).toFixed(1)}" width="${bx * 2 + 4}" height="${((y2 - y1) * bb * 2).toFixed(1)}" fill="${col}"/>`;
    const top = by - bb, H = bb * 2;
    let inner = '', over = '';
    const pat = () => {
      if (c.pat === 'stripes') return Array.from({ length: 8 }, (_, i) => `<rect x="${100 - bx}" y="${(top + 6 + i * 12).toFixed(1)}" width="${bx * 2}" height="5" fill="${c2}"/>`).join('');
      if (c.pat === 'dots') return Array.from({ length: 14 }, (_, i) => `<circle cx="${(100 - bx + 8 + (i % 5) * bx * 0.42 + (Math.floor(i / 5) % 2) * 8).toFixed(1)}" cy="${(top + 12 + Math.floor(i / 5) * 18).toFixed(1)}" r="3.2" fill="${c2}"/>`).join('');
      if (c.pat === 'zigzag') return `<path d="M${100 - bx} ${(by - 4).toFixed(1)} ${Array.from({ length: 10 }, (_, i) => `l${(bx / 5).toFixed(1)} ${i % 2 ? -7 : 7}`).join(' ')}" fill="none" stroke="${c2}" stroke-width="4"/>`;
      if (c.pat === 'star') return `<text x="100" y="${(by - bb * 0.05).toFixed(1)}" font-size="${(bb * 0.55).toFixed(1)}" text-anchor="middle" dominant-baseline="central">⭐</text>`;
      if (c.pat === 'heart') return `<text x="100" y="${(by - bb * 0.05).toFixed(1)}" font-size="${(bb * 0.5).toFixed(1)}" text-anchor="middle" dominant-baseline="central">💗</text>`;
      return '';
    };
    switch (c.shape) {
      case 'tee': inner = R(0, 0.72, c1) + pat(); break;
      case 'sweater': case 'hoodie': inner = R(0, 0.85, c1) + pat() + R(0.8, 0.86, c2);
        if (c.shape === 'hoodie') inner += `<rect x="${100 - bx * 0.45}" y="${(by + bb * 0.2).toFixed(1)}" width="${(bx * 0.9).toFixed(1)}" height="${(bb * 0.38).toFixed(1)}" rx="6" fill="${dk}" opacity=".35"/><path d="M95 ${top + 4} v${(bb * 0.4).toFixed(1)} M105 ${top + 4} v${(bb * 0.4).toFixed(1)}" stroke="#fff" stroke-width="2"/>`;
        break;
      case 'pajama': case 'raincoat': case 'space': case 'armor': case 'coat': inner = R(0, 1, c1) + pat();
        if (c.shape === 'raincoat') inner += [0.15, 0.4, 0.65].map(f => `<circle cx="100" cy="${(top + H * f).toFixed(1)}" r="3" fill="${c2}"/>`).join('');
        if (c.shape === 'space') inner += `<rect x="${100 - bx * 0.4}" y="${(by - bb * 0.25).toFixed(1)}" width="${(bx * 0.8).toFixed(1)}" height="${(bb * 0.5).toFixed(1)}" rx="5" fill="#DDE6F5" stroke="#9AA8C7" stroke-width="2"/><circle cx="${100 - bx * 0.2}" cy="${by}" r="3.5" fill="#FF5A5A"/><circle cx="100" cy="${by}" r="3.5" fill="#FFD34E"/><circle cx="${100 + bx * 0.2}" cy="${by}" r="3.5" fill="#4CD08A"/>`;
        if (c.shape === 'armor') inner += [0.3, 0.55, 0.8].map(f => `<path d="M${100 - bx} ${(top + H * f).toFixed(1)} Q100 ${(top + H * f + 8).toFixed(1)} ${100 + bx} ${(top + H * f).toFixed(1)}" fill="none" stroke="${c2}" stroke-width="3"/>`).join('') + `<path d="M100 ${top} v${H}" stroke="${c2}" stroke-width="2.5"/>`;
        if (c.shape === 'coat') inner += `<path d="M100 ${top} v${H}" stroke="#C9D3E3" stroke-width="2.5"/><path d="M${100 - bx * 0.4} ${top + 2} L100 ${(top + bb * 0.6).toFixed(1)} L${100 + bx * 0.4} ${top + 2}" fill="none" stroke="#C9D3E3" stroke-width="3"/><g transform="translate(${100 + bx * 0.45} ${(by + bb * 0.1).toFixed(1)})"><rect x="-5" y="-1.5" width="10" height="3" fill="#E53935"/><rect x="-1.5" y="-5" width="3" height="10" fill="#E53935"/></g>`;
        break;
      case 'dress': inner = R(0, 0.55, c1) + pat(); break;
      case 'overalls': inner = R(0.48, 1, c1) + `<rect x="${100 - bx * 0.42}" y="${(by - bb * 0.35).toFixed(1)}" width="${(bx * 0.84).toFixed(1)}" height="${(bb * 0.45).toFixed(1)}" fill="${c1}"/>
        <path d="M${100 - bx * 0.38} ${(by - bb * 0.3).toFixed(1)} L${100 - bx * 0.62} ${top + 2} M${100 + bx * 0.38} ${(by - bb * 0.3).toFixed(1)} L${100 + bx * 0.62} ${top + 2}" stroke="${c1}" stroke-width="6"/>
        <circle cx="${100 - bx * 0.3}" cy="${(by - bb * 0.25).toFixed(1)}" r="2.8" fill="${c2}"/><circle cx="${100 + bx * 0.3}" cy="${(by - bb * 0.25).toFixed(1)}" r="2.8" fill="${c2}"/>`; break;
      case 'sailor': inner = R(0, 0.75, '#FFFFFF') + R(0.72, 0.76, c1) + `<path d="M${100 - bx} ${top} L100 ${(top + bb * 0.75).toFixed(1)} L${100 + bx} ${top}z" fill="${c1}"/><path d="M${100 - bx * 0.5} ${top} L100 ${(top + bb * 0.55).toFixed(1)} L${100 + bx * 0.5} ${top}z" fill="#fff"/><path d="M95 ${(top + bb * 0.6).toFixed(1)} l5 9 l5 -9z" fill="#E53935"/>`; break;
      case 'pirate': inner = R(0, 0.75, '#fff') + Array.from({ length: 6 }, (_, i) => `<rect x="${100 - bx}" y="${(top + 4 + i * 11).toFixed(1)}" width="${bx * 2}" height="5" fill="${c1}"/>`).join('') + R(0.66, 0.76, '#5B3A1E') + `<rect x="94" y="${(top + H * 0.655).toFixed(1)}" width="12" height="${(H * 0.11).toFixed(1)}" rx="2" fill="#FFD34E"/>`; break;
      case 'tux': inner = R(0, 0.8, '#fff') + `<path d="M${100 - bx} ${top} L${100 - 8} ${top} L${100 - 4} ${(by + bb * 0.6).toFixed(1)} L${100 - bx} ${(by + bb * 0.6).toFixed(1)}z M${100 + bx} ${top} L${100 + 8} ${top} L${100 + 4} ${(by + bb * 0.6).toFixed(1)} L${100 + bx} ${(by + bb * 0.6).toFixed(1)}z" fill="${c1}"/>`
        + [0.15, 0.35, 0.55].map(f => `<circle cx="100" cy="${(top + H * f * 0.6 + 10).toFixed(1)}" r="2" fill="#333"/>`).join(''); break;
      case 'apron': inner = `<rect x="${100 - bx * 0.6}" y="${(by - bb * 0.45).toFixed(1)}" width="${(bx * 1.2).toFixed(1)}" height="${(bb * 1.5).toFixed(1)}" rx="6" fill="${c1}" stroke="#D5D9E0" stroke-width="2"/><rect x="${100 - bx * 0.25}" y="${(by + bb * 0.15).toFixed(1)}" width="${(bx * 0.5).toFixed(1)}" height="${(bb * 0.3).toFixed(1)}" rx="3" fill="none" stroke="${c2}" stroke-width="2"/>`
        + `<path d="M${100 - bx * 0.55} ${(by - bb * 0.42).toFixed(1)} Q100 ${top - 6} ${100 + bx * 0.55} ${(by - bb * 0.42).toFixed(1)}" fill="none" stroke="${c2}" stroke-width="2.5"/>`; break;
      default: inner = R(0, 0.7, c1);
    }
    if (c.shape === 'dress') {
      const wy = by + bb * 0.08, fl = bx * 1.32, ky = Math.min(184, by + bb + 6);
      over = `<path d="M${100 - bx * 0.92} ${wy.toFixed(1)} L${(100 - fl).toFixed(1)} ${ky.toFixed(1)} Q100 ${(ky + 8).toFixed(1)} ${(100 + fl).toFixed(1)} ${ky.toFixed(1)} L${100 + bx * 0.92} ${wy.toFixed(1)}z" fill="${c1}" stroke="${dk}" stroke-width="2.5" stroke-linejoin="round"/>`
        + (c.c2 ? `<path d="M${(100 - fl + 4).toFixed(1)} ${(ky - 6).toFixed(1)} Q100 ${(ky + 2).toFixed(1)} ${(100 + fl - 4).toFixed(1)} ${(ky - 6).toFixed(1)}" fill="none" stroke="${c.c2}" stroke-width="4"/>` : '')
        + `<rect x="${100 - bx * 0.95}" y="${(wy - 3).toFixed(1)}" width="${(bx * 1.9).toFixed(1)}" height="6" rx="3" fill="${c.c2 || dk}"/>`;
    }
    return `${clip}<g clip-path="url(#${uid}t)">${inner}<ellipse cx="100" cy="${by}" rx="${bx}" ry="${bb}" fill="none" stroke="${dk}" stroke-width="2" opacity=".5"/></g>${over}`;
  },

  feetItem(c, g) {
    const c1 = c.c1, dk = Pet.shade(c1, -0.3);
    return [-1, 1].map(s => {
      const fx = 100 + s * g.fx + s * 2, fy = g.fy, [rx, ry] = g.fr;
      if (c.shape === 'boots') return `<rect x="${fx - 9}" y="${fy - 18}" width="18" height="18" rx="5" fill="${c1}" stroke="${dk}" stroke-width="2.5"/><ellipse cx="${fx}" cy="${fy}" rx="${rx + 1}" ry="${ry + 1}" fill="${c1}" stroke="${dk}" stroke-width="2.5"/><rect x="${fx - 9}" y="${fy - 18}" width="18" height="4" rx="2" fill="${c.c2 || '#fff'}"/>`;
      if (c.shape === 'slippers') return `<ellipse cx="${fx}" cy="${fy}" rx="${rx + 2}" ry="${ry + 2}" fill="${c1}" stroke="${dk}" stroke-width="2"/><ellipse cx="${fx - 4}" cy="${fy - ry - 3}" rx="3" ry="7" fill="${c1}" stroke="${dk}" stroke-width="1.5"/><ellipse cx="${fx + 4}" cy="${fy - ry - 3}" rx="3" ry="7" fill="${c1}" stroke="${dk}" stroke-width="1.5"/><circle cx="${fx}" cy="${fy - 1}" r="2" fill="#FF7A9A"/>`;
      if (c.shape === 'shoes') return `<ellipse cx="${fx}" cy="${fy}" rx="${rx + 1}" ry="${ry + 1}" fill="${c1}" stroke="${dk}" stroke-width="2.5"/><ellipse cx="${fx - 3}" cy="${fy - 3}" rx="${rx * 0.45}" ry="2" fill="#fff" opacity=".45"/><rect x="${fx - 3}" y="${fy - ry - 1}" width="6" height="4" rx="1" fill="${c.c2 || '#FFD34E'}"/>`;
      return `<ellipse cx="${fx}" cy="${fy}" rx="${rx + 1.5}" ry="${ry + 1.5}" fill="${c1}" stroke="${dk}" stroke-width="2.5"/><path d="M${fx - rx} ${fy + 3} Q${fx} ${fy + ry + 3} ${fx + rx} ${fy + 3}" fill="none" stroke="#fff" stroke-width="3"/><circle cx="${fx - 3}" cy="${fy - 3}" r="1.6" fill="#fff"/><circle cx="${fx + 3}" cy="${fy - 3}" r="1.6" fill="#fff"/>`;
    }).join('');
  },

  /* Предметы «на спине»: часть рисуется позади питомца (layer 'back'), часть — поверх (лямки, застёжка) */
  backItem(c, g, layer, uid) {
    const c1 = c.c1, dk = Pet.shade(c1, -0.3), { by, bx, bb } = g;
    const sy = by - bb * 0.62;
    if (c.shape === 'backpack') {
      if (layer === 'back') return `<rect x="${100 - bx - 14}" y="${(by - bb * 0.55).toFixed(1)}" width="30" height="${(bb * 1.05 + 6).toFixed(1)}" rx="9" fill="${c1}" stroke="${dk}" stroke-width="2.5"/><rect x="${100 - bx - 11}" y="${(by + bb * 0.05).toFixed(1)}" width="20" height="${(bb * 0.35).toFixed(1)}" rx="5" fill="${c.c2 || dk}"/>`;
      return `<path d="M${100 - bx * 0.55} ${sy.toFixed(1)} Q${100 - bx * 0.75} ${by.toFixed(1)} ${100 - bx * 0.55} ${(by + bb * 0.5).toFixed(1)} M${100 + bx * 0.55} ${sy.toFixed(1)} Q${100 + bx * 0.75} ${by.toFixed(1)} ${100 + bx * 0.55} ${(by + bb * 0.5).toFixed(1)}" fill="none" stroke="${dk}" stroke-width="5" stroke-linecap="round"/>`;
    }
    if (c.shape === 'cape') {
      if (layer === 'back') return `<path d="M${100 - bx * 0.75} ${sy.toFixed(1)} Q${100 - bx * 1.5} 150 ${100 - bx * 1.35} 186 L${100 + bx * 1.35} 186 Q${100 + bx * 1.5} 150 ${100 + bx * 0.75} ${sy.toFixed(1)}z" fill="${c1}" stroke="${dk}" stroke-width="2.5" stroke-linejoin="round"/>`
        + (c.pat === 'ermine' ? `<path d="M${100 - bx * 1.35} 182 L${100 + bx * 1.35} 182" stroke="#fff" stroke-width="7"/>` : '');
      return `<path d="M${100 - bx * 0.8} ${sy.toFixed(1)} Q100 ${(sy + 10).toFixed(1)} ${100 + bx * 0.8} ${sy.toFixed(1)}" fill="none" stroke="${c1}" stroke-width="6" stroke-linecap="round"/><circle cx="100" cy="${(sy + 5).toFixed(1)}" r="5" fill="${c.c2 || '#FFD34E'}" stroke="${dk}" stroke-width="1.5"/>`;
    }
    if (c.shape === 'fairy') {
      if (layer !== 'back') return '';
      return `<g opacity=".75" stroke="${dk}" stroke-width="2">${[-1, 1].map(s => `<ellipse cx="${100 + s * (bx + 16)}" cy="${(sy - 4).toFixed(1)}" rx="22" ry="15" fill="${c1}" transform="rotate(${s * -25} ${100 + s * (bx + 16)} ${(sy - 4).toFixed(1)})"/><ellipse cx="${100 + s * (bx + 10)}" cy="${(sy + 22).toFixed(1)}" rx="14" ry="10" fill="${c.c2 || c1}" transform="rotate(${s * 20} ${100 + s * (bx + 10)} ${(sy + 22).toFixed(1)})"/>`).join('')}</g>`;
    }
    if (c.shape === 'jetpack') {
      if (layer !== 'back') return '';
      return [-1, 1].map(s => `<rect x="${100 + s * (bx - 2) - 9}" y="${(sy - 2).toFixed(1)}" width="18" height="${(bb * 1.1).toFixed(1)}" rx="8" fill="${c1}" stroke="${dk}" stroke-width="2.5"/><path class="flame" d="M${100 + s * (bx - 2) - 6} ${(sy + bb * 1.1 - 2).toFixed(1)} l6 14 l6 -14z" fill="#FF9F43"/>`).join('');
    }
    return '';
  },

  neckItem(c, g) {
    const y = g.hy + g.hr * 0.98, c1 = c.c1, dk = Pet.shade(c1, -0.3);
    if (c.shape === 'bowtie') return `<path d="M100 ${y.toFixed(1)} l-14 -8 v16z M100 ${y.toFixed(1)} l14 -8 v16z" fill="${c1}" stroke="${dk}" stroke-width="2" stroke-linejoin="round"/><circle cx="100" cy="${y.toFixed(1)}" r="4" fill="${dk}"/>`;
    if (c.shape === 'tie') return `<path d="M95 ${(y - 3).toFixed(1)} h10 l-2 6 l5 24 l-8 7 l-8 -7 l5 -24z" fill="${c1}" stroke="${dk}" stroke-width="2" stroke-linejoin="round"/>`;
    return '';
  },

  hatItem(c, g) {
    const { hy, hr } = g, t = hy - hr, c1 = c.c1 || '#FFFFFF', dk = Pet.shade(c1, -0.3);
    const f = n => n.toFixed(1);
    switch (c.shape) {
      case 'toque': return `<rect x="${f(100 - hr * 0.6)}" y="${f(t - 6)}" width="${f(hr * 1.2)}" height="14" rx="4" fill="#fff" stroke="#C9D3E3" stroke-width="2"/>
        <circle cx="${f(100 - hr * 0.4)}" cy="${f(t - 16)}" r="${f(hr * 0.36)}" fill="#fff" stroke="#C9D3E3" stroke-width="2"/><circle cx="${f(100 + hr * 0.4)}" cy="${f(t - 16)}" r="${f(hr * 0.36)}" fill="#fff" stroke="#C9D3E3" stroke-width="2"/><circle cx="100" cy="${f(t - 26)}" r="${f(hr * 0.42)}" fill="#fff" stroke="#C9D3E3" stroke-width="2"/>
        <rect x="${f(100 - hr * 0.58)}" y="${f(t - 4)}" width="${f(hr * 1.16)}" height="10" fill="#fff"/>`;
      case 'bandana': return `<path d="M${f(100 - hr * 0.98)} ${f(hy - hr * 0.2)} Q${f(100 - hr)} ${f(t - 6)} 100 ${f(t - 6)} Q${f(100 + hr)} ${f(t - 6)} ${f(100 + hr * 0.98)} ${f(hy - hr * 0.2)} Q100 ${f(hy - hr * 0.5)} ${f(100 - hr * 0.98)} ${f(hy - hr * 0.2)}z" fill="${c1}" stroke="${dk}" stroke-width="2.5"/>
        <path d="M${f(100 + hr * 0.95)} ${f(hy - hr * 0.25)} l14 10 l-4 -14 l12 -2z" fill="${c1}" stroke="${dk}" stroke-width="2"/>${[-0.5, 0, 0.5].map(k => `<circle cx="${f(100 + k * hr)}" cy="${f(t + hr * 0.25)}" r="3" fill="#fff"/>`).join('')}`;
      case 'helmet': return `<path d="M${f(100 - hr * 1.02)} ${f(hy - hr * 0.15)} Q${f(100 - hr * 1.02)} ${f(t - 4)} 100 ${f(t - 4)} Q${f(100 + hr * 1.02)} ${f(t - 4)} ${f(100 + hr * 1.02)} ${f(hy - hr * 0.15)}z" fill="${c1}" stroke="${dk}" stroke-width="2.5"/>
        <path d="M100 ${f(t - 4)} v${f(hr * 0.85)}" stroke="${dk}" stroke-width="2.5"/><path d="M100 ${f(t - 4)} q-6 -22 14 -26 q-4 12 4 20z" fill="#E53935"/>`;
      case 'nightcap': return `<path d="M${f(100 - hr * 0.95)} ${f(hy - hr * 0.35)} Q${f(100 - hr * 0.4)} ${f(t - hr * 0.9)} ${f(100 + hr * 1.1)} ${f(t - hr * 0.2)} Q${f(100 + hr * 0.5)} ${f(t + 2)} ${f(100 + hr * 0.95)} ${f(hy - hr * 0.35)}z" fill="${c1}" stroke="${dk}" stroke-width="2.5"/>
        <rect x="${f(100 - hr * 0.98)}" y="${f(hy - hr * 0.48)}" width="${f(hr * 1.96)}" height="11" rx="5" fill="#fff"/><circle cx="${f(100 + hr * 1.12)}" cy="${f(t - hr * 0.2)}" r="7" fill="#fff"/>`;
      case 'doccap': return `<path d="M${f(100 - hr * 0.85)} ${f(hy - hr * 0.5)} Q${f(100 - hr * 0.8)} ${f(t - 10)} 100 ${f(t - 10)} Q${f(100 + hr * 0.8)} ${f(t - 10)} ${f(100 + hr * 0.85)} ${f(hy - hr * 0.5)}z" fill="#fff" stroke="#C9D3E3" stroke-width="2.5"/>
        <g transform="translate(100 ${f(t + 1)})"><rect x="-6" y="-2" width="12" height="4" fill="#E53935"/><rect x="-2" y="-6" width="4" height="12" fill="#E53935"/></g>`;
      case 'dome': return `<circle cx="100" cy="${f(hy)}" r="${f(hr * 1.22)}" fill="#BFE4FF" opacity=".28" stroke="#fff" stroke-width="4"/><path d="M${f(100 - hr * 0.7)} ${f(hy - hr * 0.7)} q${f(hr * 0.3)} ${f(-hr * 0.35)} ${f(hr * 0.75)} ${f(-hr * 0.38)}" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`;
      default: return '';
    }
  },

  egg(o, fill, dark, defs, uid) {
    return `<svg viewBox="0 0 200 200" class="pet-svg" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>
      <ellipse cx="100" cy="186" rx="44" ry="8" fill="#000" opacity=".12"/>
      <g class="pet-egg"><path d="M100 36 C140 36 158 110 152 140 C146 172 124 184 100 184 C76 184 54 172 48 140 C42 110 60 36 100 36z" fill="#FFF8EC" stroke="#E2C9A0" stroke-width="4"/>
      <circle cx="80" cy="92" r="12" fill="${fill}"/><circle cx="122" cy="120" r="16" fill="${fill}"/><circle cx="86" cy="150" r="10" fill="${fill}"/><circle cx="118" cy="70" r="7" fill="${fill}"/>
      <path d="M70 60 Q76 50 86 46" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/></g></svg>`;
  },
};
