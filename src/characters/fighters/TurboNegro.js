// TurboNegro.js — simplified, uses BaseFighter.attack()
import BaseFighter from '../fighters/BaseFighter.js';

export default class TurboNegro extends BaseFighter {
  static preload(scene) {
    const base = 'assets/Characters/fighters/turbonegro/';
    scene.load.image('turboStanding1', `${base}standing/standing1.png`);
    scene.load.image('turboStanding2', `${base}standing/standing2.png`);
    scene.load.image('turboStanding3', `${base}standing/standing3.png`);
    scene.load.image('turboStanding4', `${base}standing/standing4.png`);
    scene.load.image('turboWalk1', `${base}walking/walking1.png`);
    scene.load.image('turboWalk2', `${base}walking/walking2.png`);
    scene.load.image('turboWalk3', `${base}walking/walking3.png`);
    scene.load.image('turboWalk4', `${base}walking/walking4.png`);
    scene.load.image('turboJump1', `${base}jumping/jump1.png`);
    scene.load.image('turboJump2', `${base}jumping/jump2.png`);
    scene.load.image('turboJump3', `${base}jumping/jump3.png`);
    scene.load.image('turboGroundAttack_windup', `${base}attack/groundattack/groundAttack_windup.png`);
    scene.load.image('turboGroundAttack_impact', `${base}attack/groundattack/groundAttack_impact.png`);
    scene.load.image('turboGroundAttack_recoil', `${base}attack/groundattack/groundAttack_recoil.png`);
    scene.load.image('turboHit1', `${base}hitreaction/Frame1.png`);
    scene.load.image('turboHit2', `${base}hitreaction/Frame2.png`);
  }

  static registerAnimations(scene) {
    const a = scene.anims;
    const make = (k, cfg) => !a.exists(k) && a.create(cfg);

    make('turboStanding_idle', { key: 'turboStanding_idle', frames: [
      { key: 'turboStanding1' }, { key: 'turboStanding2' }, { key: 'turboStanding3' }, { key: 'turboStanding4' }
    ], frameRate: 5, repeat: -1 });

    make('turboStanding_walk', { key: 'turboStanding_walk', frames: [
      { key: 'turboWalk1' }, { key: 'turboWalk2' }, { key: 'turboWalk3' }, { key: 'turboWalk4' }
    ], frameRate: 7, repeat: -1 });

    make('turboStanding_jump', { key: 'turboStanding_jump', frames: [
      { key: 'turboJump1' }, { key: 'turboJump2' }, { key: 'turboJump3' }
    ], frameRate: 5, repeat: -1 });

    make('turboStanding_attack', { key: 'turboStanding_attack', frames: [
      { key: 'turboGroundAttack_windup' }, { key: 'turboGroundAttack_impact' }, { key: 'turboGroundAttack_recoil' }
    ], frameRate: 14, repeat: 0 });

    make('turboStanding_hit', { key: 'turboStanding_hit', frames: [
      { key: 'turboHit1' }, { key: 'turboHit2' }
    ], frameRate: 10, repeat: 0 });
  }

  constructor(scene, x, y) {
    super(scene, x, y, 'turboStanding1');
    this.crossfadeDuration = 120;
    this.lastDirection = 1;
    TurboNegro.registerAnimations(scene);
    this.playSafe('turboStanding_idle', true);
  }
}
