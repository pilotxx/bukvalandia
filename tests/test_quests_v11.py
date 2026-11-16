"""Mission regressions: alternate solutions, corrections and safe resuming."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import os
import unittest

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class QuestV11Tests(unittest.TestCase):
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
        self.ctx = self.browser.new_context(viewport={'width': 800, 'height': 1100}, has_touch=True, service_workers='block')
        self.page = self.ctx.new_page()
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))
        self.page.goto(self.url)
        self.ensure_scene_script()
        self.page.evaluate('''() => {
          S.onboarded=true;S.settings.sound=false;S.settings.tts=false;
          S.settings.petVoice=false;S.settings.autoBackup=false;
          S.seenSubjects={ru:true,math:true,en:true};
          S.house.questDrafts={};document.querySelector('#onb')?.remove();
          answer = value => { window.__sceneAnswer=value;L.answered=true;Quest.capture();save(); };
          save();
        }''')

    def ensure_scene_script(self):
        if self.page.evaluate('typeof SceneTasks') == 'undefined':
            self.page.add_script_tag(url=self.url + '/js/scenes.js')
        if not self.page.locator('link[href*="scenes.css"]').count():
            self.page.add_style_tag(url=self.url + '/css/scenes.css')

    def tearDown(self):
        self.ctx.close()
        self.assertEqual(self.errors, [])

    def mount(self, task, resume=False):
        self.page.evaluate('''({task,resume}) => {
          task.qid='cafe';task.idx=0;task.answer='ok';task.kind='scene';
          if(!resume)delete S.house.questDrafts.cafe;
          L={mode:'quest',ref:'cafe',queue:[{t:task},...Quest.tasks('cafe').slice(1)],pos:0,total:8,
             first:0,clean:0,wrongs:0,hints:0,coins:0,xp:0,combo:0,maxCombo:0,correctAll:0,fixed:0,answered:false};
          if(resume)Quest.restore();
          window.__sceneAnswer=null;
          document.querySelector('#screen').innerHTML=SceneTasks.html(curTask().t);
          SceneTasks.bind(curTask().t,document.querySelector('#screen'));
          Quest.capture();
        }''', {'task': task, 'resume': resume})

    @staticmethod
    def cart_task():
        return {'sceneType': 'cart', 'target': 20, 'maxItems': 6, 'items': [
            {'id': 'juice', 'icon': '🥤', 'label': 'Сок', 'price': 5},
            {'id': 'cake', 'icon': '🧁', 'label': 'Кекс', 'price': 10},
            {'id': 'apple', 'icon': '🍎', 'label': 'Яблоко', 'price': 7},
        ]}

    def test_cart_accepts_different_real_orders_and_undo(self):
        self.mount(self.cart_task())
        for item in ['juice', 'juice', 'cake']:
            self.page.locator(f'[data-cart-add="{item}"]').tap()
        self.page.locator('[data-scene-check]').tap()
        self.assertEqual(self.page.evaluate('window.__sceneAnswer'), 'ok')
        self.mount(self.cart_task())
        for _ in range(5):
            self.page.locator('[data-cart-add="juice"]').tap()
        self.page.locator('[data-scene-undo]').tap()
        self.assertEqual(self.page.evaluate("document.querySelector('.scene-task')._sceneState.counts.juice"), 4)
        self.page.locator('[data-scene-check]').tap()
        self.assertEqual(self.page.evaluate('window.__sceneAnswer'), 'ok')

    def test_wrong_cart_is_not_accepted(self):
        self.mount(self.cart_task())
        self.page.locator('[data-cart-add="apple"]').tap()
        self.page.locator('[data-cart-add="cake"]').tap()
        self.page.locator('[data-scene-check]').tap()
        self.assertEqual(self.page.evaluate('window.__sceneAnswer'), 'bad')

    def test_area_requires_rectangle_and_optional_perimeter(self):
        result = self.page.evaluate('''() => {
          const task={sceneType:'area',cols:6,rows:4,target:12};
          const wide={cells:[0,1,2,3,4,5,6,7,8,9,10,11]};
          const squareLike={cells:[0,1,2,3,6,7,8,9,12,13,14,15]};
          const holes={cells:[0,1,2,3,6,7,8,9,12,13,14,20]};
          return [SceneTasks.check(task,wide),SceneTasks.check(task,squareLike),SceneTasks.check(task,holes),
                  SceneTasks.check({...task,perimeter:14},wide),SceneTasks.check({...task,perimeter:14},squareLike)];
        }''')
        self.assertEqual(result, [True, True, False, False, True])
        self.mount({'sceneType':'area','cols':6,'rows':4,'target':12,'perimeter':14})
        for cell in [0,1,2,3,6,7,8,9,12,13,14,15]:
            self.page.locator(f'[data-area-cell="{cell}"]').tap()
        self.page.locator('[data-scene-check]').tap()
        self.assertEqual(self.page.evaluate('window.__sceneAnswer'), 'ok')

    def test_pairs_can_be_corrected_before_submission(self):
        task={'sceneType':'match','pairs':[
            {'id':'book','left':'book','right':'📖'},
            {'id':'pen','left':'pen','right':'🖊️'},
            {'id':'ruler','left':'ruler','right':'📏'},
        ]}
        self.mount(task)
        self.page.locator('[data-match-left="book"]').tap()
        self.page.locator('[data-match-right="pen"]').tap()
        self.page.locator('[data-scene-undo]').tap()
        self.assertEqual(self.page.evaluate("document.querySelector('.scene-task')._sceneState.links.length"),0)
        for item in ['book','pen','ruler']:
            self.page.locator(f'[data-match-left="{item}"]').tap()
            self.page.locator(f'[data-match-right="{item}"]').tap()
        self.page.locator('[data-scene-check]').tap()
        self.assertEqual(self.page.evaluate('window.__sceneAnswer'), 'ok')
        self.mount(task)
        for left,right in [('book','pen'),('pen','book'),('ruler','ruler')]:
            self.page.locator(f'[data-match-left="{left}"]').tap()
            self.page.locator(f'[data-match-right="{right}"]').tap()
        self.page.locator('[data-scene-check]').tap()
        self.assertEqual(self.page.evaluate('window.__sceneAnswer'), 'bad')

    def test_scene_moves_resume_after_reload_without_replaying_answer(self):
        task=self.cart_task()
        self.mount(task)
        self.page.locator('[data-cart-add="juice"]').tap()
        self.page.reload()
        self.ensure_scene_script()
        self.page.evaluate("() => { answer=value=>{window.__sceneAnswer=value;L.answered=true;Quest.capture();save()}; }")
        self.mount(task,resume=True)
        self.assertEqual(self.page.locator('[data-cart-remove="juice"]').count(),1)
        self.page.locator('[data-cart-add="juice"]').tap()
        self.page.locator('[data-cart-add="cake"]').tap()
        self.page.locator('[data-scene-check]').tap()
        self.assertEqual(self.page.evaluate('S.house.questDrafts.cafe.pos'),1)
        self.assertIsNone(self.page.evaluate('S.house.questDrafts.cafe.sceneState'))
        self.page.evaluate("L.pos=0;L.first=0;L.coins=0;L.answered=false;Quest.restore()")
        self.assertEqual(self.page.evaluate('L.pos'),1)

    def test_story_order_short_prompts_and_v10_results_are_preserved(self):
        result=self.page.evaluate(r'''() => {
          S.house.quests.mail={best:7,plays:3,done:true};S.owned.souvenir_mail=true;
          const records=JSON.stringify(S.house.quests),gifts=JSON.stringify(S.owned);
          const tasks=QUESTS.flatMap(q=>Quest.tasks(q.id));
          const serial=JSON.parse(JSON.stringify(tasks));
          return {ordered:QUESTS.every(q=>Quest.tasks(q.id).every((e,i)=>e.t.idx===i)),
            longest:Math.max(...tasks.map(e=>e.t.prompt.replace(/<[^>]+>/g,'').split(/\s+/).length)),
            records:records===JSON.stringify(S.house.quests),gifts:gifts===JSON.stringify(S.owned),
            count:serial.length,kindCount:new Set(tasks.map(e=>e.t.kind)).size,
            firstMail:Quest.make('mail',0).options.map(o=>o.label)};
        }''')
        self.assertTrue(result['ordered'])
        self.assertLessEqual(result['longest'],9)
        self.assertTrue(result['records'])
        self.assertTrue(result['gifts'])
        self.assertEqual(result['count'],48)
        self.assertGreaterEqual(result['kindCount'],5)
        self.assertEqual(set(result['firstMail']),{'лесная','Лесная'})

    def test_current_hint_is_saved_without_changing_total_hint_count(self):
        self.mount(self.cart_task())
        self.page.evaluate('L.hint=true;L.hints=2;Quest.capture()')
        self.assertTrue(self.page.evaluate('S.house.questDrafts.cafe.stepHint'))
        self.page.reload()
        self.ensure_scene_script()
        restored=self.page.evaluate("() => { L={mode:'quest',ref:'cafe'};return Quest.restore(); }")
        self.assertTrue(restored)
        self.assertEqual(self.page.evaluate('L.hints'),2)
        self.assertTrue(self.page.evaluate('S.house.questDrafts.cafe.stepHint'))
        self.page.evaluate('L.answered=true;Quest.capture()')
        self.assertFalse(self.page.evaluate('S.house.questDrafts.cafe.stepHint'))
        self.assertEqual(self.page.evaluate('S.house.questDrafts.cafe.hints'),2)

    def test_pack_select_and_undo(self):
        self.mount({'sceneType':'pack','request':'book + pencil','want':['book','pencil'],'items':[
            {'id':'book','label':'book','icon':'📖'},
            {'id':'pencil','label':'pencil','icon':'✏️'},
            {'id':'ball','label':'ball','icon':'⚽'},
        ]})
        for item in ['book','ball']:
            self.page.locator(f'[data-pack-item="{item}"]').tap()
        self.page.locator('[data-scene-undo]').tap()
        self.page.locator('[data-pack-item="pencil"]').tap()
        self.page.locator('[data-scene-check]').tap()
        self.assertEqual(self.page.evaluate('window.__sceneAnswer'),'ok')


if __name__ == '__main__':
    unittest.main()
