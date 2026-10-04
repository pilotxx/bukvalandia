'use strict';
/* ============================================================
   Букваландия — рисование питомца (SVG)
   ============================================================ */

const Pet = {
  shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = c => Math.max(0, Math.min(255, Math.round(c + (amt > 0 ? (255 - c) * amt : c * amt))));
    return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(x => x.toString(16).padStart(2, '0')).join('');
  },

  /* opts: species, color, stage (0..4), hat, glasses, neck, mood ('happy'|'sad'|'wow'), uid */
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

    const k = [0, 0.72, 0.82, 0.92, 1][o.stage];
    const sp = o.species;
    const st = o.stage;
    let back = '', front = '';

    /* Хвост */
    if (sp === 'dragon') back += `<path d="M150 150 Q190 150 182 112 Q178 128 160 132" fill="${fill}" stroke="${dark}" stroke-width="3"/>${st >= 2 ? `<path d="M180 108 l8 -10 l2 14z" fill="${dark}"/>` : ''}`;
    if (sp === 'cat' && st >= 2) back += `<path d="M152 152 Q196 140 178 96" fill="none" stroke="${fill}" stroke-width="14" stroke-linecap="round"/><path d="M152 152 Q196 140 178 96" fill="none" stroke="${dark}" stroke-width="3" stroke-linecap="round" opacity=".35"/>`;
    if (sp === 'bunny') back += `<circle cx="158" cy="150" r="13" fill="${light}" stroke="${dark}" stroke-width="3"/>`;

    /* Крылья у дракона */
    if (sp === 'dragon' && st >= 3) {
      const wg = st >= 4 ? 1.25 : 1;
      back += `<g transform="translate(100 105) scale(${wg}) translate(-100 -105)">
        <path d="M48 100 Q10 60 18 110 Q28 104 34 120 Q40 108 50 118z" fill="${light}" stroke="${dark}" stroke-width="3"/>
        <path d="M152 100 Q190 60 182 110 Q172 104 166 120 Q160 108 150 118z" fill="${light}" stroke="${dark}" stroke-width="3"/></g>`;
    }

    /* Уши / рожки */
    if (sp === 'cat') {
      back += `<path d="M58 82 L62 38 L92 66z" fill="${fill}" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/><path d="M142 82 L138 38 L108 66z" fill="${fill}" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M66 70 L67 50 L82 64z" fill="#FFB3C7"/><path d="M134 70 L133 50 L118 64z" fill="#FFB3C7"/>`;
    }
    if (sp === 'bunny') {
      const h = [0, 34, 44, 54, 60][st];
      back += `<ellipse cx="76" cy="${70 - h / 2}" rx="13" ry="${h}" fill="${fill}" stroke="${dark}" stroke-width="3" transform="rotate(-12 76 70)"/>
        <ellipse cx="124" cy="${70 - h / 2}" rx="13" ry="${h}" fill="${fill}" stroke="${dark}" stroke-width="3" transform="rotate(12 124 70)"/>
        <ellipse cx="76" cy="${72 - h / 2}" rx="6" ry="${h - 10}" fill="#FFC2D4" transform="rotate(-12 76 70)"/>
        <ellipse cx="124" cy="${72 - h / 2}" rx="6" ry="${h - 10}" fill="#FFC2D4" transform="rotate(12 124 70)"/>`;
    }
    if (sp === 'dragon') {
      const h = [0, 10, 16, 22, 28][st];
      back += `<path d="M74 72 Q70 ${66 - h} 62 ${62 - h} Q82 ${64 - h} 86 70z" fill="#FFE7A3" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M126 72 Q130 ${66 - h} 138 ${62 - h} Q118 ${64 - h} 114 70z" fill="#FFE7A3" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>`;
      if (st >= 2) back += `<path d="M92 66 l8 -12 l8 12z" fill="${dark}"/>`;
    }

    /* Тело */
    const body = `<ellipse cx="100" cy="120" rx="62" ry="56" fill="${fill}" stroke="${dark}" stroke-width="3.5"/>
      <ellipse cx="100" cy="138" rx="36" ry="30" fill="${light}" opacity=".85"/>
      <ellipse cx="72" cy="174" rx="16" ry="9" fill="${fill}" stroke="${dark}" stroke-width="3"/>
      <ellipse cx="128" cy="174" rx="16" ry="9" fill="${fill}" stroke="${dark}" stroke-width="3"/>`;

    /* Лицо */
    const mood = o.mood || 'happy';
    const eyes = mood === 'wow'
      ? `<g class="pet-eyes"><circle cx="80" cy="108" r="14" fill="#fff"/><circle cx="120" cy="108" r="14" fill="#fff"/><circle cx="80" cy="108" r="9" fill="#2B2350"/><circle cx="120" cy="108" r="9" fill="#2B2350"/><circle cx="84" cy="104" r="3.5" fill="#fff"/><circle cx="124" cy="104" r="3.5" fill="#fff"/></g>`
      : `<g class="pet-eyes"><ellipse cx="80" cy="108" rx="12" ry="14" fill="#fff"/><ellipse cx="120" cy="108" rx="12" ry="14" fill="#fff"/><circle cx="82" cy="110" r="8" fill="#2B2350"/><circle cx="118" cy="110" r="8" fill="#2B2350"/><circle cx="85" cy="106" r="3" fill="#fff"/><circle cx="121" cy="106" r="3" fill="#fff"/></g>`;
    const brows = mood === 'sad' ? `<path d="M68 95 Q78 92 88 88" fill="none" stroke="#2B2350" stroke-width="3" stroke-linecap="round"/><path d="M132 95 Q122 92 112 88" fill="none" stroke="#2B2350" stroke-width="3" stroke-linecap="round"/>` : '';
    const mouth = mood === 'sad'
      ? `<path d="M90 138 Q100 130 110 138" fill="none" stroke="#2B2350" stroke-width="3.5" stroke-linecap="round"/>`
      : mood === 'wow'
        ? `<ellipse cx="100" cy="134" rx="8" ry="9" fill="#2B2350"/><ellipse cx="100" cy="138" rx="5" ry="4" fill="#FF7A9A"/>`
        : `<path d="M88 130 Q100 144 112 130" fill="#2B2350" stroke="#2B2350" stroke-width="3" stroke-linejoin="round"/><path d="M93 135 Q100 141 107 135" fill="#FF7A9A"/>`;
    const cheeks = `<ellipse cx="64" cy="128" rx="9" ry="6" fill="#FF8FAB" opacity=".55"/><ellipse cx="136" cy="128" rx="9" ry="6" fill="#FF8FAB" opacity=".55"/>`;
    let extra = '';
    if (sp === 'cat') extra += `<g stroke="#2B2350" stroke-width="2" stroke-linecap="round" opacity=".55"><path d="M56 124 L38 120"/><path d="M56 130 L38 132"/><path d="M144 124 L162 120"/><path d="M144 130 L162 132"/></g>`;
    if (sp === 'dragon' && st >= 2) extra += `<g fill="${dark}" opacity=".35"><circle cx="66" cy="148" r="4"/><circle cx="134" cy="148" r="4"/><circle cx="100" cy="76" r="4"/></g>`;

    /* Аксессуары */
    const em = (x, y, size, ch) => ch ? `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" dominant-baseline="central">${ch}</text>` : '';
    const acc = em(100, 172 - 8, 38, o.neck) + em(100, 108, 54, o.glasses) + em(100, 62, 56, o.hat);

    const aura = st >= 4 ? `<g class="pet-aura">${em(28, 40, 22, '✨')}${em(176, 60, 18, '✨')}${em(170, 170, 20, '✨')}${em(26, 160, 16, '✨')}</g>` : '';

    return `<svg viewBox="0 0 200 200" class="pet-svg" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>
      <ellipse cx="100" cy="186" rx="${58 * k}" ry="8" fill="#000" opacity=".12"/>
      <g class="pet-body"><g transform="translate(100 186) scale(${k}) translate(-100 -186)">${back}${body}${extra}${cheeks}${eyes}${brows}${mouth}${acc}</g></g>${aura}</svg>`;
  },

  egg(o, fill, dark, defs, uid) {
    return `<svg viewBox="0 0 200 200" class="pet-svg" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>
      <ellipse cx="100" cy="184" rx="44" ry="8" fill="#000" opacity=".12"/>
      <g class="pet-egg"><path d="M100 36 C140 36 158 110 152 140 C146 172 124 184 100 184 C76 184 54 172 48 140 C42 110 60 36 100 36z" fill="#FFF8EC" stroke="#E2C9A0" stroke-width="4"/>
      <circle cx="80" cy="92" r="12" fill="${fill}"/><circle cx="122" cy="120" r="16" fill="${fill}"/><circle cx="86" cy="150" r="10" fill="${fill}"/><circle cx="118" cy="70" r="7" fill="${fill}"/>
      <path d="M70 60 Q76 50 86 46" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/></g></svg>`;
  },
};
