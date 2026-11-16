"""Real tablet interactions and regressions found by independent critics."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import os
import unittest
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):
        pass

class PlayV11Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
        Thread(target=cls.server.serve_forever,daemon=True).start()
        cls.url=f'http://127.0.0.1:{cls.server.server_port}'
        cls.pw=sync_playwright().start()
        cls.browser=cls.pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])

    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.pw.stop();cls.server.shutdown();cls.server.server_close()

    def setUp(self):
        self.errors=[]
        self.ctx=self.browser.new_context(viewport={'width':800,'height':1100},has_touch=True,service_workers='block')
        self.page=self.ctx.new_page()
        self.page.on('pageerror',lambda e:self.errors.append(str(e)))
        self.page.goto(self.url)
        self.page.evaluate('''() => {
          document.querySelector('#onb')?.remove();S.onboarded=true;S.coins=2345;
          S.stars.vowels=3;S.bosses=Object.fromEntries(ALL_WORLDS.map(w=>[w.id,true]));
          S.settings.sound=false;S.settings.petVoice=false;S.settings.tts=false;
          S.settings.sleepFrom=0;S.settings.autoBackup=false;
          S.seenSubjects={ru:true,math:true,en:true};TAB='pet';House.migrate();save();render();
        }''')

    def tearDown(self):
        self.ctx.close()
        self.assertEqual(self.errors,[])

    def game(self,name):
        self.page.evaluate('(name)=>House.openStation(name)',name)
        self.page.locator('#houseActivity .play-goal').wait_for()

    def close_modals(self):
        for _ in range(8):
            buttons=self.page.locator('.modal-wrap:not(.out) [data-mb]')
            if not buttons.count():break
            buttons.last.click();self.page.wait_for_timeout(200)

    def solve_bridge(self):
        plan=self.page.evaluate("BridgeGame.solution(document.querySelector('#houseActivity')._bridge.level)")
        for tile in plan:
            for _ in range(4):
                correct=self.page.evaluate('(p)=>{const g=document.querySelector("#houseActivity")._bridge,c=g.board.cells[p.index];return BridgeGame.rotate(c.mask,c.turns)===p.mask;}',tile)
                if correct:break
                self.page.locator(f'[data-bridge="{tile["index"]}"]').tap()
        self.assertTrue(self.page.evaluate("document.querySelector('#houseActivity')._bridge.trace().win"))

    def test_bridge_route_undo_and_cancel_on_level_change(self):
        self.game('blocks')
        original=self.page.evaluate('S.house.play.bridges.boards[0].cells[0].turns')
        self.page.locator('[data-bridge="0"]').tap()
        self.page.locator('[data-bridge-undo]').tap()
        self.assertEqual(self.page.evaluate('S.house.play.bridges.boards[0].cells[0].turns'),original)
        self.solve_bridge()
        self.page.locator('[data-bridge-run]').tap()
        self.page.locator('[data-play-level="1"]').tap()
        self.page.wait_for_timeout(1900)
        self.assertFalse(self.page.evaluate('!!S.house.gallery.bridge_0'))
        self.assertNotIn('Получилось',self.page.locator('.play-message').inner_text())
        self.solve_bridge()
        self.page.locator('[data-bridge-run]').tap()
        self.page.wait_for_function('!!S.house.gallery.bridge_1')
        plays=self.page.evaluate('S.counters.play')
        self.page.locator('[data-bridge-run]').tap()
        self.page.wait_for_timeout(2700)
        self.assertEqual(self.page.evaluate('S.counters.play'),plays)
        self.assertEqual(self.page.evaluate('S.coins'),2345)

    def test_all_maps_and_silhouettes_are_solvable(self):
        result=self.page.evaluate('''() => ({
          bridges:BridgeGame.levels.map(level=>{const board=BridgeGame.create(level);BridgeGame.solution(level).forEach(p=>board.cells[p.index].turns=0);return BridgeGame.trace(level,board).win;}),
          shapes:ShapeGame.levels.map(level=>({mask:ShapeGame.mask(level).size,pieces:level.pieces.reduce((s,p)=>s+p.length,0),solution:!!ShapeGame.solve(level,[],false)}))
        })''')
        self.assertTrue(all(result['bridges']))
        for shape in result['shapes']:
            self.assertEqual(shape['mask'],shape['pieces'])
            self.assertTrue(shape['solution'])

    def test_shape_hint_handles_identical_swapped_pieces_and_room_exhibition(self):
        self.game('art')
        self.page.locator('[data-play-level="1"]').tap()
        while self.page.evaluate('S.house.play.shapes.boards[1].turns[0]'):
            self.page.locator('[data-shape-turn]').tap()
        self.page.locator('[data-shape-cell="3"]').tap()  # Place L0 in L1's equally valid slot.
        self.assertEqual(self.page.evaluate('S.house.play.shapes.boards[1].placements.length'),1)
        self.page.locator('[data-shape-hint]').tap()
        target=self.page.locator('.shape-board .point-here')
        self.assertEqual(target.count(),1)
        self.assertNotEqual(target.get_attribute('data-shape-cell'),'3')
        target.tap()
        self.assertEqual(self.page.evaluate('S.house.play.shapes.boards[1].placements.length'),2)
        for _ in range(2):
            self.page.locator('[data-shape-hint]').tap()
            self.page.locator('.shape-board .point-here').tap()
        self.assertTrue(self.page.evaluate('!!S.house.gallery.shape_1'))
        self.assertTrue(self.page.evaluate('S.hidden.work_shape_1'))
        self.page.locator('.play-exhibit').tap()
        self.page.locator('[data-place="work_shape_1"][data-room="observatory"]').tap()
        self.close_modals()
        self.page.locator('[data-act="houseRoom"][data-arg="observatory"]').tap()
        self.assertEqual(self.page.locator('.ri[data-id="work_shape_1"] svg').count(),1)
        self.page.reload()
        self.assertEqual(self.page.evaluate('S.house.play.shapes.boards[1].placements.length'),4)
        self.assertEqual(self.page.evaluate('S.house.placements.work_shape_1'),'observatory')

    def test_drag_ghost_is_removed_when_closed_mid_drag(self):
        self.game('art')
        box=self.page.locator('[data-piece="0"]').bounding_box()
        self.page.mouse.move(box['x']+20,box['y']+20);self.page.mouse.down()
        self.page.mouse.move(box['x']+90,box['y']-90,steps=5)
        self.assertEqual(self.page.locator('.shape-drag-ghost').count(),1)
        self.page.evaluate("document.querySelector('.modal-wrap:not(.out)').close()")
        self.page.wait_for_timeout(250);self.page.mouse.up()
        self.assertEqual(self.page.locator('.shape-drag-ghost').count(),0)

    def test_music_edit_has_real_undo_and_stop_label(self):
        self.game('music')
        self.page.locator('[data-music-mode="compose"]').tap()
        for n in [0,1,2]:self.page.locator(f'[data-note="{n}"]').tap()
        self.page.locator('[data-edit-note="0"]').tap()
        self.page.locator('[data-note="4"]').tap()
        self.assertEqual(self.page.evaluate('S.house.play.music.notes'),[4,1,2])
        self.page.locator('[data-note-undo]').tap()
        self.assertEqual(self.page.evaluate('S.house.play.music.notes'),[0,1,2])
        self.page.locator('[data-save-tune]').tap()
        self.assertEqual(self.page.evaluate('S.house.melody'),[0,1,2])
        self.page.locator('[data-note-play]').tap()
        self.page.locator('[data-note-play]').tap()
        self.assertIn('Слушать',self.page.locator('[data-note-play]').inner_text())
        self.page.locator('[data-note="3"]').tap()
        self.assertEqual(self.page.evaluate('S.house.play.music.notes'),[0,1,2,3])

    def test_stars_show_enough_evidence_for_alternating_pattern(self):
        self.game('stars');self.page.locator('[data-play-level="1"]').tap()
        data=self.page.evaluate("document.querySelector('#houseActivity')._stars")
        self.assertEqual(data['prefix'],4)
        self.assertEqual(self.page.locator('.star-known').count(),4)
        steps=[data['seq'][i+1]-data['seq'][i] for i in range(3)]
        self.assertEqual(steps,[2,4,2])
        wrong=next(n for n in data['values'] if n not in data['seq'])
        self.page.locator(f'[data-star="{wrong}"]').tap()
        self.assertEqual(self.page.evaluate('S.house.play.stars.puzzles[1].picked'),[])
        for n in data['seq'][4:]:self.page.locator(f'[data-star="{n}"]').tap()
        self.assertTrue(self.page.evaluate('!!S.house.gallery.stars_1'))

    def test_aquarium_feeding_works_with_empty_personal_reef(self):
        self.page.evaluate('S.house.aquarium.fish=[]')
        self.game('aquarium')
        self.page.locator('[data-aqua-mode="mission"]').tap()
        self.page.locator('[data-aqua-level="1"]').tap()
        self.assertFalse(self.page.locator('.aqua-species').is_visible())
        self.assertFalse(self.page.locator('[data-aqua-remove]').is_visible())
        for fish,count in [('🐠',6),('🐟',4),('🐡',2)]:
            for _ in range(count):self.page.locator(f'[data-feed-plus="{fish}"]').tap()
        self.page.locator('[data-aqua-check]').tap()
        self.assertTrue(self.page.evaluate('!!S.house.gallery.aquarium_1'))
        self.assertEqual(self.page.evaluate('S.house.aquarium.fish'),[])

    def test_aquarium_removal_is_explicit_and_undoable(self):
        self.game('aquarium')
        before=self.page.evaluate('S.house.aquarium.fish')
        self.page.locator('[data-aqua-fish="0"]').tap(force=True)
        self.assertEqual(self.page.evaluate('S.house.aquarium.fish'),before)
        self.page.locator('[data-aqua-remove]').tap()
        self.page.locator('[data-aqua-fish="0"]').tap(force=True)
        self.assertEqual(len(self.page.evaluate('S.house.aquarium.fish')),len(before)-1)
        self.page.locator('[data-aqua-undo]').tap()
        self.assertEqual(self.page.evaluate('S.house.aquarium.fish'),before)

    def test_theatre_accepts_alternative_order_and_shows_blocked_frame(self):
        self.game('theatre')
        for ident in ['bloom','plant','water','sun']:
            self.page.locator(f'[data-film-action="{ident}"]').tap()
        self.page.locator('[data-film-play]').tap()
        self.assertEqual(self.page.locator('.theatre-timeline .blocked').count(),1)
        for _ in range(4):self.page.locator('[data-film-undo]').tap()
        for ident in ['plant','sun','water','bloom']:
            self.page.locator(f'[data-film-action="{ident}"]').tap()
        self.page.locator('[data-film-play]').tap()
        self.page.wait_for_function('!!S.house.gallery.film_0')
        self.assertIn('🌻',self.page.locator('.theatre-props').inner_text())

    def test_pet_routine_is_created_and_performed_in_room(self):
        self.page.evaluate("House.train('dance')")
        for command in ['hop','bow','spin']:
            self.page.locator(f'[data-command="{command}"]').tap()
        self.page.locator('[data-routine-save]').tap()
        self.assertEqual(self.page.evaluate('S.house.routines.dance'),['hop','bow','spin'])
        self.close_modals()
        self.page.evaluate("() => { House.performRoutine('dance'); }")
        self.assertTrue(self.page.evaluate('Room.busy'))
        self.page.wait_for_function('!Room.busy')
        self.assertEqual(self.page.evaluate('S.coins'),2345)

    def test_v10_snapshot_and_existing_creations_survive_upgrade(self):
        raw=self.page.evaluate("""() => {
          S.house.painting=Array(160).fill('#FF8C98');S.house.building=Array(70).fill('#67CFBA');
          S.house.melody=[0,2,4,6];S.house.aquarium={fish:['🐙','🐢'],water:2};
          delete S.house.playVersion;delete S.house.play;delete S.house.gallery;delete S.house.routines;delete S.house.questDrafts;
          localStorage.removeItem(KEY+'_before_v11');save();return localStorage.getItem(KEY);
        }""")
        self.page.reload()
        self.assertEqual(self.page.evaluate('S.coins'),2345)
        self.assertEqual(self.page.evaluate('S.house.playVersion'),11)
        self.assertEqual(self.page.evaluate('S.house.painting[0]'),'#FF8C98')
        self.assertEqual(self.page.evaluate('S.house.melody'),[0,2,4,6])
        self.assertEqual(self.page.evaluate('S.house.aquarium.fish'),['🐙','🐢'])
        self.assertEqual(self.page.evaluate("localStorage.getItem(KEY+'_before_v11')"),raw)
        self.page.evaluate('S.coins=2500;save()')
        self.page.reload()
        self.assertEqual(self.page.evaluate("localStorage.getItem(KEY+'_before_v11')"),raw)
        self.assertEqual(self.page.evaluate('S.coins'),2500)

    def test_gallery_import_does_not_execute_markup(self):
        self.page.evaluate("S.house.gallery.bad={name:'<img src=x>',preview:'<svg onload=\"window.__bad=1\"><script>window.__bad=2</script><circle cx=10 cy=10 r=8 fill=\"url(https://example.com)\"/></svg><img src=x onerror=\"window.__bad=3\">'};S.house.album.badicon={name:'Imported',icon:'<img src=x onerror=\"window.__bad=4\">',t:1};House.migrate();House.album()")
        self.assertEqual(self.page.locator('.play-preview script,.play-preview img,.play-preview [onload]').count(),0)
        self.assertFalse(self.page.evaluate('!!window.__bad'))

if __name__=='__main__':
    unittest.main()
