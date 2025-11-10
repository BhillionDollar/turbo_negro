// ReReMarie.js — simplified, uses BaseFighter.attack()
import BaseFighter from '../fighters/BaseFighter.js';

export default class ReReMarie extends BaseFighter {
  static preload(scene) {
    const base = 'assets/Characters/fighters/reremarie/';
    scene.load.image('rereIdle1', `${base}idle/Idle1.png`);
    scene.load.image('rereIdle2', `${base}idle/Idle2.png`);
    scene.load.image('rereIdle3', `${base}idle/Idle3.png`);
    scene.load.image('rereWalk1', `${base}walking/walking1.png`);
    scene.load.image('rereWalk2', `${base}walking/walking2.png`);
    scene.load.image('rereWalk3', `${base}walking/walking3.png`);
    scene.load.image('rereWalk4', `${base}walking/walking4.png`);
    scene.load.image('rereJump1', `${base}jumping/jumping1.png`);
    scene.load.image('rereJump2', `${base}jumping/jumping2.png`);
    scene.load.image('rereJump3', `${base}jumping/jumping3.png`);
    scene.load.image('rereJump4', `${base}jumping/jumping4.png`);
    scene.load.image('rereGroundAttack_windup', `${base}attack/groundattack/groundattack_windup.png`);
    scene.load.image('rereGroundAttack_impact', `${base}attack/groundattack/groundattack_impact.png`);
    scene.load.image('rereGroundAttack_recoil', `${base}attack/groundattack/groundattack_recoil.png`);
    scene.load.image('rereHit1', `${base}hitreaction/Frame1.png`);
    scene.load.image('rereHit2', `${base}hitreaction/Frame2.png`);
  }

  static registerAnimations(scene) {
    const a = scene.anims;
    const make = (k, cfg) => !a.exists(k) && a.create(cfg);

    make('rereIdle_idle', { key: 'rereIdle_idle', frames: [
      { key: 'rereIdle1' }, { key: 'rereIdle2' }, { key: 'rereIdle3' }
    ], frameRate: 6, repeat: -1 });

    make('rereIdle_walk', { key: 'rereIdle_walk', frames: [
      { key: 'rereWalk1' }, { key: 'rereWalk2' }, { key: 'rereWalk3' }, { key: 'rereWalk4' }
    ], frameRate: 8, repeat: -1 });

    make('rereIdle_jump', { key: 'rereIdle_jump', frames: [
      { key: 'rereJump1' }, { key: 'rereJump2' }, { key: 'rereJump3' }, { key: 'rereJump4' }
    ], frameRate: 6, repeat: -1 });

    make('rereIdle_attack', { key: 'rereIdle_attack', frames: [
      { key: 'rereGroundAttack_windup' }, { key: 'rereGroundAttack_impact' }, { key: 'rereGroundAttack_recoil' }
    ], frameRate: 17, repeat: 0 });

    make('rereIdle_hit', { key: 'rereIdle_hit', frames: [
      { key: 'rereHit1' }, { key: 'rereHit2' }
    ], frameRate: 10, repeat: 0 });
  }

  constructor(scene, x, y) {
    super(scene, x, y, 'rereIdle1');
    this.crossfadeDuration = 100;
    ReReMarie.registerAnimations(scene);
    this.playSafe('rereIdle_idle', true);
  }
}
