import { Scene } from 'phaser';
import { navigateTo } from '../../utils/navigation';

export class Scene3 extends Scene {
  constructor() {
    super('Scene3');
    this.config = {
      cardW: 660,
      cardH: 920,
      maxDragDist: 40,
      completeThreshold: 0.9,
    };
    this.isProcessing = false;
  }

  create() {
    const { width } = this.scale;
    const centerX = width / 2;
    this.cameras.main.setBackgroundColor('#ffffff');

    // 상단 내비게이션
    this.add
      .text(40, 60, '←', { fontSize: '40px', color: '#000000', fontFamily: 'Pretendard, Arial' })
      .setOrigin(0, 0.5)
      .setInteractive()
      .on('pointerdown', () => navigateTo(this, 'Home'));

    this.add
      .text(centerX, 60, 'PDO VS PCL', {
        fontSize: '32px',
        color: '#1f2937',
        fontFamily: 'Pretendard, Arial',
      })
      .setOrigin(0.5);

    if (!this.anims.exists('mouth_open')) {
      this.anims.create({
        key: 'mouth_open',
        frames: this.anims.generateFrameNumbers('face_muscle', { start: 0, end: -1 }),
        frameRate: 15,
        repeat: 0,
      });
    }

    this.createContentLayout(centerX);
  }

  createContentLayout(centerX) {
    const spriteScale = 0.7;
    const threadScale = 0.35;
    const indicatorScale = 0.5;
    const pointX = centerX + 10;
    const pointY = 780;

    // 배경 카드
    this.drawCardBg(centerX, 650, '제목', '부제목');

    // 메인 근육
    this.muscle = this.add.sprite(centerX, 650, 'face_muscle').setScale(spriteScale).setOrigin(0.5);

    // --- 스테이지 1: 클릭 포인트 ---
    this.pointGraphics = this.add.graphics();
    this.pointGraphics.fillStyle(0xff0000, 0.6).lineStyle(3, 0xffff00, 1);
    this.pointGraphics.fillCircle(pointX, pointY, 40).strokeCircle(pointX, pointY, 40);
    this.clickPoint = this.add
      .circle(pointX, pointY, 40, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    // --- 하단 인디케이터 ---
    const indicatorY = 1050;
    this.indicatorPDO = this.add
      .image(centerX, indicatorY, 'thread_lifting')
      .setScale(indicatorScale)
      .setAngle(0)
      .setTint(0x3498db)
      .setVisible(true); // 처음부터 보임

    this.indicatorPCL = this.add
      .image(centerX, indicatorY, 'thread_lifting')
      .setScale(indicatorScale)
      .setAngle(0)
      .setTint(0xf8fafc)
      .setAlpha(0.4)
      .setVisible(false);

    // --- 얼굴 위 드래그 실 ---
    this.threadPDO = this.add
      .image(centerX + 120, 750, 'thread_lifting')
      .setScale(threadScale)
      .setAngle(110)
      .setOrigin(0.5)
      .setTint(0x3498db)
      .setVisible(false);

    this.threadPCL = this.add
      .image(centerX + 120, 750, 'thread_lifting')
      .setScale(threadScale)
      .setAngle(110)
      .setOrigin(0.5)
      .setTint(0xf8fafc)
      .setAlpha(0.4)
      .setVisible(false);

    // 초기화 루프
    const resetToHomeStage = () => {
      this.isProcessing = false;
      this.muscle.setFrame(0);
      this.threadPCL.setVisible(false).disableInteractive().removeAllListeners();
      this.indicatorPCL.setVisible(false);
      this.indicatorPDO.setVisible(true); // 다시 PDO 인디케이터 표시
      this.pointGraphics.setVisible(true);
      this.clickPoint.setInteractive();
    };

    // 1️⃣ 클릭 포인트 시퀀스 (입 벌리기)
    this.clickPoint.on('pointerdown', () => {
      if (this.isProcessing) return;
      this.isProcessing = true;
      this.pointGraphics.setVisible(false);
      this.clickPoint.disableInteractive();

      this.muscle.play('mouth_open');
      this.muscle.once('animationcomplete', () => {
        this.muscle.setFrame(0);
        this.isProcessing = false;

        // 🚨 PDO 드래그 단계로 전환: 하단은 PCL 인디케이터로 교체
        this.indicatorPDO.setVisible(false);
        this.indicatorPCL.setVisible(true);
        this.threadPDO.setVisible(true).setInteractive({ draggable: true });

        this.setupDragLogic(this.threadPDO, 4, () => {
          // 🚨 PCL 드래그 단계로 전환: 하단 인디케이터 모두 제거
          this.threadPDO.setVisible(false).disableInteractive();
          this.indicatorPCL.setVisible(false);
          this.threadPCL.setVisible(true).setInteractive({ draggable: true });

          this.setupDragLogic(this.threadPCL, 7, () => {
            resetToHomeStage();
          });
        });
      });
    });
  }

  setupDragLogic(target, maxFrame, onComplete) {
    target.removeAllListeners();
    target.startX = null;
    target.startY = null;
    let isGoalReached = false;
    let hasStartedDragging = false;

    target.on('drag', (pointer) => {
      if (this.isProcessing && !hasStartedDragging) return;
      if (!target.startX) {
        target.startX = target.x;
        target.startY = target.y;
        this.isProcessing = true;
        hasStartedDragging = true;
      }

      const angleRad = Phaser.Math.DegToRad(target.angle);
      const dx = pointer.x - target.startX;
      const dy = pointer.y - target.startY;

      let dist = dx * Math.cos(angleRad) + dy * Math.sin(angleRad);
      dist = Phaser.Math.Clamp(dist, -this.config.maxDragDist, 0);

      target.x = target.startX + dist * Math.cos(angleRad);
      target.y = target.startY + dist * Math.sin(angleRad);

      const absDist = Math.abs(dist);
      const progress = absDist / this.config.maxDragDist;
      isGoalReached = progress >= this.config.completeThreshold;

      let frame = 0;
      if (absDist > 0) frame = Math.max(1, Math.ceil(progress * maxFrame));
      this.muscle.setFrame(Math.min(frame, maxFrame));
    });

    target.on('dragend', () => {
      if (!hasStartedDragging) return;

      this.tweens.add({
        targets: target,
        x: target.startX,
        y: target.startY,
        duration: 400,
        ease: 'Back.easeOut',
        onUpdate: () => {
          const d = Phaser.Math.Distance.Between(target.x, target.y, target.startX, target.startY);
          const p = d / this.config.maxDragDist;
          let f = 0;
          if (d > 0.5) f = Math.max(1, Math.ceil(p * maxFrame));
          this.muscle.setFrame(Math.min(f, maxFrame));
        },
        onComplete: () => {
          this.muscle.setFrame(0);
          target.startX = null;
          hasStartedDragging = false;

          if (isGoalReached) {
            this.isProcessing = false;
            target.off('drag');
            target.off('dragend');
            if (onComplete) onComplete();
          } else {
            this.isProcessing = false;
            isGoalReached = false;
          }
        },
      });
    });
  }

  drawCardBg(x, y, title, desc) {
    const { cardW, cardH } = this.config;
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 32);
    graphics.lineStyle(1.5, 0xa8c5de, 0.2);
    graphics.strokeRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 32);

    this.add.text(x - cardW / 2 + 40, y - cardH / 2 + 40, title, {
      fontSize: '30px',
      color: '#1f2937',
      fontFamily: 'Pretendard, Arial',
    });
    this.add.text(x - cardW / 2 + 40, y - cardH / 2 + 85, desc, {
      fontSize: '20px',
      color: '#9ca3af',
      fontFamily: 'Pretendard, Arial',
    });
  }
}
