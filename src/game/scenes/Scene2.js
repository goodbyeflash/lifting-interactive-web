import { Scene } from 'phaser';
import { navigateTo } from '../../utils/navigation';

export class Scene2 extends Scene {
  constructor() {
    super('Scene2');
    this.config = {
      cardW: 660,
      cardH: 920,
      // 🚨 탄성 옵션값 추출
      pdoElasticity: 0.1, // PDO: 덜 늘어남 (뻣뻣함)
      pclElasticity: 0.3, // PCL: 많이 늘어남 (고무줄 같음)
      maxDragY: 200, // 최대 당길 수 있는 거리 (px)
    };
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

    this.createContentLayout(centerX);
  }

  createContentLayout(centerX) {
    this.drawCardBg(centerX, 650, '제목', '부제목');

    const threadBaseY = 1050; // 실 하단 고정 위치
    const offsetX = 120;
    const threadScale = 0.8;
    const textOffsetY = 20;

    // 1. 왼쪽 실 (PDO)
    this.thread1 = this.add
      .image(centerX - offsetX, threadBaseY, 'thread_lifting')
      .setScale(threadScale)
      .setAngle(90)
      .setOrigin(1, 0.5) // 💡 기준점을 오른쪽(회전 후 하단)으로 잡아 바닥 고정
      .setTint(0x3498db)
      .setInteractive({ draggable: true });

    this.add
      .text(centerX - offsetX, threadBaseY + textOffsetY, 'PDO', {
        fontSize: '28px',
        color: '#1f2937',
        fontWeight: '700',
        fontFamily: 'Pretendard, Arial',
      })
      .setOrigin(0.5);

    // 2. 오른쪽 실 (PCL)
    this.thread2 = this.add
      .image(centerX + offsetX, threadBaseY, 'thread_lifting')
      .setScale(threadScale)
      .setAngle(90)
      .setOrigin(1, 0.5) // 💡 기준점 하단 고정
      .setTint(0xf8fafc)
      .setAlpha(0.4)
      .setInteractive({ draggable: true });

    this.add
      .text(centerX + offsetX, threadBaseY + textOffsetY, 'PCL', {
        fontSize: '28px',
        color: '#1f2937',
        fontWeight: '700',
        fontFamily: 'Pretendard, Arial',
      })
      .setOrigin(0.5);

    // 🚨 드래그 및 탄성 로직 설정
    this.setupElasticDrag(threadBaseY, threadScale);
  }

  setupElasticDrag(baseY, baseScale) {
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      // 위로 당긴 거리 계산 (0보다 작아지지 않게 처리)
      const dragDist = Math.max(0, Math.min(baseY - dragY, this.config.maxDragY));

      // 어떤 실인지에 따라 탄성값 선택
      const elasticity =
        gameObject === this.thread1 ? this.config.pdoElasticity : this.config.pclElasticity;

      // 💡 늘어남 계산: 기본 스케일에 (거리 * 탄성 계수) 반영
      // 회전된 상태이므로 세로 길이는 scaleX에 영향을 받습니다.
      gameObject.scaleX = baseScale + dragDist * 0.005 * elasticity;
    });

    this.input.on('dragend', (pointer, gameObject) => {
      // 💡 손을 놓으면 튕기듯이 원래대로 돌아가는 효과 (Tween)
      this.tweens.add({
        targets: gameObject,
        scaleX: baseScale,
        duration: 0,
        ease: 'Elastic.easeOut', // 고무줄 같은 반동 효과
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
