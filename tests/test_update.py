"""Browser regressions: python -m unittest discover -s tests -v

Requires Playwright for Python and Chromium (CHROMIUM_PATH overrides its path).
All data is synthetic and lives in isolated browser contexts.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import os
import unittest

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class BigUpdateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
        Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.url = f'http://127.0.0.1:{cls.server.server_port}'
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), headless=True, args=['--no-sandbox'])

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()
        cls.server.shutdown()
        cls.server.server_close()

    def setUp(self):
        self.errors = []
        self.context = self.browser.new_context(viewport={'width': 800, 'height': 1100}, has_touch=True, service_workers='block')
        self.page = self.context.new_page()
        self.page.on('pageerror', lambda e: self.errors.append(str(e)))
        self.page.goto(self.url)
        self.page.evaluate('''() => {
          S.onboarded=true; S.name='Тест'; S.settings.sound=false;
          S.settings.tts=false; S.settings.petVoice=false;
          S.settings.autoBackup=false; S.settings.sleepFrom=0;
          S.settings.dailyLimit=0; S.settings.openAll=true;
          S.seenSubjects={ru:true,math:true,en:true};
          document.querySelector('#onb')?.remove();save();render();
        }''')

    def tearDown(self):
        self.context.close()
        self.assertEqual(self.errors, [])

    def dismiss(self):
        for _ in range(12):
            buttons = self.page.locator('.modal-wrap:not(.out) [data-mb]')
            if not buttons.count():
                break
            buttons.last.click()
            self.page.wait_for_timeout(230)

    def answer_task(self):
        task = self.page.evaluate('curTask().t')
        if task['kind'] == 'choice':
            self.page.locator('#lBody .opt').evaluate_all('(els,a)=>els.find(e=>e.dataset.arg===String(a)).click()', task['answer'])
        elif task['kind'] == 'input':
            for digit in str(task['answer']):
                self.page.locator(f'[data-act="key"][data-arg="{digit}"]').click()
            self.page.locator('[data-act="key"][data-arg="ok"]').click()
        elif task['kind'] == 'multi':
            for val in task['answer'].split('|'):
                self.page.locator(f'[data-multi="{val}"]').click()
            self.page.locator('#multiCheck').click()
        elif task['kind'] == 'scene':
            import itertools
            if task['sceneType'] == 'cart':
                solution = next(counts for counts in itertools.product(range(task.get('maxItems', 6)+1), repeat=len(task['items']))
                                if 0 < sum(counts) <= task.get('maxItems', 6)
                                and sum(n*item['price'] for n,item in zip(counts,task['items'])) == task['target'])
                for n,item in zip(solution,task['items']):
                    for _ in range(n): self.page.locator(f'[data-cart-add="{item["id"]}"]').click()
            elif task['sceneType'] == 'area':
                width,height = next((w,h) for w in range(1,task['cols']+1) for h in range(1,task['rows']+1)
                                    if w*h == task['target'] and (not task.get('perimeter') or 2*(w+h)==task['perimeter']))
                for r in range(height):
                    for c in range(width):self.page.locator(f'[data-area-cell="{r*task["cols"]+c}"]').click()
            elif task['sceneType'] == 'pack':
                for ident in task['want']:self.page.locator(f'[data-pack-item="{ident}"]').click()
            elif task['sceneType'] == 'match':
                for pair in task['pairs']:
                    self.page.locator(f'[data-match-left="{pair["id"]}"]').click()
                    self.page.locator(f'[data-match-right="{pair["id"]}"]').click()
            self.page.locator('[data-scene-check]').click()
        elif task['kind'] == 'order':
            parts = list(task['answers'][0]) if task.get('join') == '' else task['answers'][0].split(' ')
            used = set()
            for part in parts:
                index = next(i for i, x in enumerate(task['pieces']) if x == part and i not in used)
                used.add(index)
                self.page.locator(f'[data-act="ordAdd"][data-arg="{index}"]').click()
            self.page.locator('[data-act="ordCheck"]').click()
        else:
            raise AssertionError(f'Unexpected task kind {task["kind"]}')

    def test_v5_migration_preserves_progress_and_keeps_original_backup(self):
        legacy = self.page.evaluate('''() => {
          const old=defaults();delete old.house;delete old.payments;old.v=5;
          old.onboarded=true;old.name='Старый герой';old.coins=2345;old.earned=9876;
          old.xp=1200;old.stars={vowels:3,soft:2,m_tens:3};old.bosses={w1:true,mw1:true,ew1:true};
          old.pet.name='Искорка';old.pet.species='cat';old.pet.hat='cap';old.pet.maxStage=2;
          old.owned={th_sky:true,ball:true,bed:true,cap:true};old.food={apple:4};
          old.room.pos={ball:[450,350],bed:[560,292]};old.hidden={bed:true};
          old.piggy={goal:{t:'prize',id:'p1'},saved:650};old.parent.pin='1234';
          old.parent.requests=[{id:'old',prize:'p2',name:'Старый приз',price:1500,status:'wait'}];
          old.settings.sound=false;old.settings.petVoice=false;old.settings.autoBackup=false;
          old.seenSubjects={ru:true,math:true,en:true};return old;
        }''')
        raw = json.dumps(legacy, ensure_ascii=False)
        raw = self.page.evaluate('(raw)=>{S=JSON.parse(raw);save();return localStorage.getItem(KEY)}', raw)
        self.page.reload()
        state = self.page.evaluate('S')
        for key in ['coins', 'earned', 'xp', 'stars', 'bosses', 'food', 'room', 'hidden', 'piggy', 'parent']:
            self.assertEqual(state[key], legacy[key], key)
        for key in ['name', 'species', 'hat', 'maxStage']:
            self.assertEqual(state['pet'][key], legacy['pet'][key])
        for key, value in legacy['owned'].items():
            self.assertEqual(state['owned'][key], value)
        self.assertEqual(state['v'], 6)
        self.assertEqual(self.page.evaluate("localStorage.getItem(KEY+'_before_v6')"), raw)
        self.assertTrue(state['owned']['home_blocks'])
        self.assertTrue(state['owned']['home_stars'])
        self.page.evaluate('S.coins=2456;save()')
        self.page.reload()
        self.assertEqual(self.page.evaluate('S.coins'), 2456)
        self.assertEqual(self.page.evaluate("localStorage.getItem(KEY+'_before_v6')"), raw)

    def test_wallet_prize_charges_once_and_survives_reload(self):
        self.page.evaluate("S.coins=1700;TAB='shop';SHOP_TAB='prizes';save();render()")
        self.page.locator('[data-act="prizeClaim"][data-arg="p1"]').tap()
        self.page.locator('.modal-wrap:not(.out) [data-mb="1"]').tap()
        self.page.wait_for_timeout(450)
        self.assertEqual(self.page.evaluate('S.coins'), 700)
        self.assertEqual(self.page.evaluate('S.parent.requests.length'), 1)
        self.assertEqual(self.page.evaluate('S.payments[0].before-S.payments[0].after'), 1000)
        self.assertIn('1 000', self.page.locator('.payment-receipt').inner_text())
        self.page.evaluate("Economy.claimPrize('p1')")
        self.assertEqual(self.page.evaluate('S.coins'), 700)
        self.page.reload()
        self.assertEqual(self.page.evaluate('S.coins'), 700)
        self.assertEqual(self.page.evaluate('S.parent.requests[0].status'), 'wait')

    def test_cancel_confirm_insufficient_money_and_stale_confirmation(self):
        self.page.evaluate("S.coins=1700;Economy.claimPrize('p1')")
        self.page.locator('.modal-wrap:not(.out) [data-mb="0"]').click()
        self.assertEqual(self.page.evaluate('S.coins'), 1700)
        self.assertEqual(self.page.evaluate('S.parent.requests.length'), 0)
        self.page.evaluate("Economy.claimPrize('p1');S.coins=900")
        self.page.locator('.modal-wrap:not(.out) [data-mb="1"]').click()
        self.assertEqual(self.page.evaluate('S.coins'), 900)
        self.assertEqual(self.page.evaluate('S.parent.requests.length'), 0)
        self.page.evaluate("Economy.claimPrize('p1')")
        self.assertEqual(self.page.locator('.modal-wrap:not(.out)').count(), 0)

    def test_piggy_payment_and_parent_refund_are_exactly_once(self):
        self.page.evaluate("S.coins=500;S.piggy={goal:{t:'prize',id:'p1'},saved:1200};piggyClaim()")
        self.page.locator('.modal-wrap:not(.out) [data-mb="1"]').click()
        self.assertEqual(self.page.evaluate('Economy.total()'), 800)  # +100 for the first piggy achievement
        self.assertEqual(self.page.evaluate('S.coins'), 800)
        self.assertEqual(self.page.evaluate('S.piggy.saved'), 0)
        self.assertEqual(self.page.evaluate('S.payments[0].price'), 1000)
        self.assertEqual(self.page.evaluate('S.payments[0].before-S.payments[0].after'), 1000)
        self.assertEqual(self.page.evaluate('S.payments[0].bonus'), 100)
        self.page.evaluate("parentPanel('prizes');Economy.resolve(S.parent.requests[0].id,'cancel');Economy.resolve(S.parent.requests[0].id,'cancel')")
        self.assertEqual(self.page.evaluate('Economy.total()'), 1800)
        self.page.evaluate("Economy.resolve(S.parent.requests[0].id,'given')")
        self.assertEqual(self.page.evaluate('S.parent.requests[0].status'), 'cancel')

    def test_room_unlocks_move_drag_and_reload(self):
        self.page.evaluate("TAB='pet';render()")
        self.page.locator('[data-act="houseRoom"][data-arg="workshop"]').tap()
        self.assertEqual(self.page.evaluate('S.house.room'), 'living')
        self.dismiss()
        self.page.evaluate("S.bosses={w1:true,mw1:true,ew1:true};S.stars.vowels=3;House.migrate();save();render()")
        self.page.locator('[data-act="houseInventory"]').tap()
        self.page.locator('[data-place="ball"][data-room="workshop"]').tap()
        self.dismiss()
        self.page.locator('[data-act="houseRoom"][data-arg="workshop"]').tap()
        self.assertEqual(self.page.locator('.ri[data-id="ball"]').count(), 1)
        self.page.locator('[data-act="houseEdit"]').tap()
        ball = self.page.locator('.ri[data-id="ball"]').bounding_box()
        self.page.mouse.move(ball['x']+ball['width']/2, ball['y']+ball['height']/2)
        self.page.mouse.down()
        self.page.mouse.move(ball['x']+ball['width']/2-100, ball['y']+ball['height']/2, steps=8)
        self.page.mouse.up()
        pos = self.page.evaluate('S.house.positions.workshop.ball')
        self.assertLess(pos[0], 420)
        self.page.reload()
        self.assertEqual(self.page.evaluate('S.house.positions.workshop.ball'), pos)
        self.assertEqual(self.page.evaluate('S.house.placements.ball'), 'workshop')
        self.page.evaluate("TAB='pet';House.switchRoom('living')")
        self.assertEqual(self.page.locator('.ri[data-id="ball"]').count(), 0)

    def test_all_quests_can_be_completed_with_new_ui_and_gifts(self):
        for qid in ['mail','detective','cafe','architect','packing','party']:
            self.page.evaluate('(id)=>startSession("quest",id)', qid)
            for _ in range(8):
                self.answer_task()
                self.page.locator('[data-act="next"]').click()
            self.assertTrue(self.page.evaluate('(id)=>S.house.quests[id].done', qid))
            self.assertTrue(self.page.evaluate('(id)=>S.owned["souvenir_"+id]', qid))
            self.page.locator('[data-act="questHome"]').click()
            self.dismiss()
        self.assertEqual(self.page.evaluate('Object.keys(S.house.quests).length'), 6)

    def test_boss_phases_shield_hint_and_strike(self):
        self.page.evaluate("startSession('boss','mw4')")
        self.page.locator('[data-act="battlePower"][data-arg="guard"]').click()
        hearts = self.page.evaluate('L.hearts')
        self.page.evaluate('Boss.wrong()')
        self.assertEqual(self.page.evaluate('L.hearts'), hearts)
        self.assertFalse(self.page.evaluate('L.guard'))
        self.page.evaluate('L.energy=3;L.hp=Math.ceil(L.hpMax*.6);showTask()')
        self.assertIn('Ловушки',self.page.locator('.battle-phase').inner_text())
        self.assertTrue(self.page.evaluate('curTask().t.battleChallenge'))
        self.page.locator('[data-act="battlePower"][data-arg="hint"]').click()
        self.assertTrue(self.page.evaluate('L.hint'))
        self.assertTrue(self.page.locator('#hintbox').inner_text())
        self.page.evaluate('L.energy=3;Battle.update()')
        self.page.locator('[data-act="battlePower"][data-arg="strike"]').click()
        hp = self.page.evaluate('L.hp')
        self.answer_task()
        self.assertEqual(self.page.evaluate('L.hp'), hp-2)
        self.assertFalse(self.page.evaluate('L.chargedStrike'))
        self.page.evaluate('L.hp=3;L.answered=false;showTask()')
        self.assertIn('Решающая',self.page.locator('.battle-phase').inner_text())
        self.page.evaluate('closeLesson()')

    def test_old_boss_animation_cannot_win_a_new_session(self):
        self.page.evaluate("S.stars.vowels=3;startSession('boss','w1');L.hp=1;showTask()")
        self.answer_task()
        self.assertTrue(self.page.evaluate('L.defeating'))
        self.page.evaluate("closeLesson();startSession('boss','mw1')")
        self.page.wait_for_timeout(5100)
        self.assertEqual(self.page.evaluate('L.ref'),'mw1')
        self.assertEqual(self.page.evaluate('L.hp'),8)
        self.assertFalse(self.page.evaluate('!!L.finished'))
        self.assertFalse(self.page.evaluate('!!S.bosses.mw1'))

    def test_skip_victory_animation_awards_only_the_won_boss(self):
        self.page.evaluate("S.stars.vowels=3;startSession('boss','w1');L.hp=1;showTask()")
        self.answer_task()
        self.page.locator('[data-act="quit"]').click()
        self.assertTrue(self.page.evaluate('L.finished'))
        self.assertTrue(self.page.evaluate('S.bosses.w1'))
        self.page.locator('[data-act="chestOpen"]').click()
        self.page.locator('[data-act="questHome"]').click()
        self.dismiss()
        self.page.evaluate("startSession('boss','mw1')")
        self.page.wait_for_timeout(5100)
        self.assertEqual(self.page.evaluate('L.ref'),'mw1')
        self.assertFalse(self.page.evaluate('!!L.finished'))
        self.assertFalse(self.page.evaluate('!!S.bosses.mw1'))

    def test_generated_challenges_always_have_valid_answers(self):
        problems=self.page.evaluate('''() => {
          const bad=[];
          const check=t=>{if(t.kind==='choice'&&!t.options.some(o=>String(o.v)===String(t.answer)))bad.push(t.label);if(t.kind==='multi'){const keys=t.options.map(o=>o.v);if(new Set(keys).size!==keys.length||!t.answer.split('|').every(x=>keys.includes(x)))bad.push(t.label);}};
          for(let n=0;n<60;n++){for(const w of ALL_WORLDS)check(Battle.challenge(w));for(const q of QUESTS)for(let i=0;i<8;i++)check(Quest.make(q.id,i));}return bad;
        }''')
        self.assertEqual(problems, [])

    def test_first_boss_victory_opens_workshop_and_chest(self):
        self.page.evaluate("S.stars.vowels=3;startSession('boss','w1');L.hp=1;showTask()")
        self.answer_task()
        self.page.locator('.result.win').wait_for(timeout=12000)
        self.assertTrue(self.page.evaluate('S.bosses.w1'))
        self.assertTrue(self.page.evaluate('S.owned.home_blocks'))
        self.page.locator('[data-act="chestOpen"]').click()
        self.page.locator('.after-chest').wait_for(state='visible')
        self.assertIn('Мастерская',self.page.locator('.house-new').all_inner_texts()[0])
        self.page.locator('[data-act="questHome"]').click()
        self.dismiss()
        self.page.locator('[data-act="houseRoom"][data-arg="workshop"]').tap()
        self.assertEqual(self.page.evaluate('S.house.room'), 'workshop')

    def test_quest_mistake_repeats_the_same_parameters(self):
        self.page.evaluate("startSession('quest','cafe');L.queue[0].t=Quest.make('cafe',1);showTask()")
        original=self.page.evaluate('curTask().t')
        self.page.locator('[data-act="key"][data-arg="0"]').click()
        self.page.locator('[data-act="key"][data-arg="ok"]').click()
        retry=self.page.evaluate('L.queue[L.queue.length-1]')
        self.assertTrue(retry['retry'])
        self.assertEqual(retry['t']['show'],original['show'])
        self.assertEqual(retry['t']['answer'],original['answer'])

    def test_late_boss_upgrades_open_new_interactions(self):
        self.page.evaluate("S.bosses=Object.fromEntries(ALL_WORLDS.slice(0,12).map(w=>[w.id,true]));S.stars.vowels=3;TAB='pet';House.migrate();render();House.openStation('aquarium')")
        self.assertEqual(self.page.locator('[data-fish="🐙"]').count(),1)
        self.dismiss()
        self.page.evaluate("S.bosses=Object.fromEntries(ALL_WORLDS.slice(0,18).map(w=>[w.id,true]));const randomBefore=Math.random;Math.random=()=>.1;House.openStation('stars');Math.random=randomBefore")
        self.page.locator('[data-play-level="3"]').tap()
        values=self.page.evaluate("document.querySelector('#houseActivity')._stars.seq.slice(3)")
        for val in values:
            self.page.locator(f'[data-star="{val}"]').tap()
        self.assertTrue(self.page.evaluate('!!S.house.album.stars_3'))
        self.dismiss()
        self.page.evaluate("S.bosses=Object.fromEntries(ALL_WORLDS.map(w=>[w.id,true]));House.migrate();render()")
        self.page.locator('[data-act="houseFestival"]').tap()
        self.assertTrue(self.page.evaluate('!!S.house.album.festival'))

    def test_activities_and_drawings_persist(self):
        self.page.evaluate("S.house.painting=Array(160).fill('#FF8C98');S.house.building=Array(70).fill('#67CFBA');S.house.melody=[0,2,4];save()")
        self.page.reload()
        self.assertEqual(self.page.evaluate('S.house.painting[0]'), '#FF8C98')
        self.assertEqual(self.page.evaluate('S.house.building[0]'), '#67CFBA')
        self.assertEqual(self.page.evaluate('S.house.melody'), [0,2,4])
        self.page.evaluate('House.album()')
        self.page.locator('[data-old-sketches]').tap()
        self.assertEqual(self.page.locator('.old-sketch').count(),2)

    def test_tablet_portrait_landscape_and_phone_do_not_overflow(self):
        self.page.evaluate("S.bosses=Object.fromEntries(ALL_WORLDS.slice(0,8).map(w=>[w.id,true]));S.stars.vowels=3;TAB='pet';House.migrate();render()")
        for width,height in [(800,1100),(1100,800),(390,844)]:
            self.page.set_viewport_size({'width':width,'height':height})
            self.assertFalse(self.page.evaluate('document.documentElement.scrollWidth>innerWidth'), f'{width}x{height}')
            self.page.evaluate("House.openStation('art')")
            self.assertFalse(self.page.evaluate('document.querySelector(".house-activity").scrollWidth>document.querySelector(".house-activity").clientWidth'),f'art {width}')
            self.dismiss()
            self.page.evaluate("startSession('boss','mw4')")
            rects=self.page.evaluate("""() => {const a=document.querySelector('.arena-pet').getBoundingClientRect(),b=document.querySelector('.battle-energy').getBoundingClientRect();return {overlap:a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top};}""")
            self.assertFalse(rects['overlap'],f'boss controls {width}x{height}')
            self.page.evaluate('closeLesson()')

    def test_offline_reload_keeps_house_and_progress(self):
        context=self.browser.new_context(viewport={'width':800,'height':1100}, service_workers='allow')
        page=context.new_page()
        try:
            page.goto(self.url)
            page.evaluate("S.onboarded=true;S.coins=4321;S.settings.autoBackup=false;S.settings.petVoice=false;S.seenSubjects={ru:true,math:true,en:true};save()")
            page.evaluate('navigator.serviceWorker.ready')
            page.reload()
            page.wait_for_function('!!navigator.serviceWorker.controller')
            context.set_offline(True)
            page.reload()
            self.assertEqual(page.evaluate('S.coins'), 4321)
            page.evaluate("TAB='pet';render()")
            self.assertIn('Гостиная',page.locator('.house-heading').inner_text())
        finally:
            context.close()


if __name__ == '__main__':
    unittest.main()
