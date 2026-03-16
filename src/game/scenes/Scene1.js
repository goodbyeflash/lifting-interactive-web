import { Scene } from 'phaser';
import { navigateTo } from '../../utils/navigation';

export class Scene1 extends Scene {
  constructor() {
    super('Scene1');

    // [물리 설정]
    this.config = {
      // 딤플 강도: 실을 당길 때 피부가 패이는 깊이 (높을수록 푹 들어감)
      dimpleIntensity: 0.001,
      // 주름 빈도: 딤플 주변에 생기는 잔주름의 개수 (낮을수록 둥글고 큼직함)
      dimpleFrequency: 10,
      // 조직 고정력: 하단 피부 조직의 단단함 (높을수록 표면만 움직이고 아래는 고정)
      skinDepthFix: 5,
      // 최대 왜곡값: 피부가 찢어지지 않도록 보호하는 최대 변형 픽셀(px) 한도
      maxDeformation: 20,
      // 표면 범위: 힘이 전달되는 깊이 비율 (0.66이면 상단 약 2/3 지점까지 영향)
      surfaceRange: 0.66,
      // 조작 범위: 실 이미지를 드래그할 수 있는 최대 좌우 거리(px)
      maxDragRange: 40,
      cardW: 660,
      cardH: 450,
      // 고정 실 피부 변형 강도 (실 이동량의 n%만 반영)
      fixedSkinStrength: 0.005,
    };
  }

  create() {
    const { width } = this.scale;
    const centerX = width / 2;

    this.cameras.main.setBackgroundColor('#ffffff');

    // 뒤로가기 버튼
    this.add
      .text(40, 60, '←', {
        fontSize: '40px',
        color: '#000000',
        fontFamily: 'Pretendard, Arial',
      })
      .setOrigin(0, 0.5)
      .setInteractive()
      .on('pointerdown', () => navigateTo(this, 'Home'));

    this.add
      .text(centerX, 60, '리프팅 VS 고정용', {
        fontSize: '32px',
        color: '#1f2937',

        fontFamily: 'Pretendard, Arial',
      })
      .setOrigin(0.5);

    // 2. 시뮬레이션 영역 (카드 레이아웃)
    this.createSimulationLayout(centerX);
  }

  createSimulationLayout(centerX) {
    // --- [섹션 1: 리프팅 실] ---
    this.drawCardBg(centerX, 415, '제목', '부제목');

    // 리프팅 피부 (Plane)
    this.liftingSkin = this.add.plane(centerX, 425, 'skin_texture', null, 32, 32).setScale(0.7);
    this.liftingSkin.ignoreDirtyCache = true;
    this.originalVertices = this.liftingSkin.vertices.map((v) => ({
      x: v.x,
      y: v.y,
      u: v.u,
      v: v.v,
    }));

    const liftingThread = this.add
      .image(centerX, 425, 'thread_lifting')
      .setScale(0.6)
      .setInteractive({ draggable: true });

    // --- [섹션 2: 고정 실] ---
    this.drawCardBg(centerX, 885, '제목', '부제목');

    // 🚨 핵심 수정: 고정 실 피부도 Plane으로 생성하여 변형 가능하게 만듭니다.
    this.fixSkin = this.add.plane(centerX, 900, 'skin_texture', null, 32, 32).setScale(0.7);
    this.fixSkin.ignoreDirtyCache = true;
    this.fixOriginalVertices = this.fixSkin.vertices.map((v) => ({
      x: v.x,
      y: v.y,
      u: v.u,
      v: v.v,
    }));

    const fixThread = this.add
      .image(centerX, 900, 'thread_fix')
      .setScale(0.6)
      .setInteractive({ draggable: true });

    this.startX = centerX;
    this.setupDragEvents(liftingThread, fixThread);
  }

  // 카드 배경 그리기 전용 (UI 통일)
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

  setupDragEvents(liftingThread, fixThread) {
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      const offset = Phaser.Math.Clamp(
        dragX - this.startX,
        -this.config.maxDragRange,
        this.config.maxDragRange,
      );
      gameObject.x = this.startX + offset;

      if (gameObject === liftingThread) {
        this.updateSkinBumpy(offset);
      } else if (gameObject === fixThread) {
        // 🚨 고정 실 드래그 시 사다리꼴 변형 함수 호출
        this.updateSkinFixed(offset);
      }
    });

    this.input.on('dragend', (pointer, gameObject) => {
      this.tweens.add({
        targets: gameObject,
        x: this.startX,
        duration: 400,
        ease: 'Cubic.easeOut',
        onUpdate: () => {
          const dist = gameObject.x - this.startX;
          if (gameObject === liftingThread) this.updateSkinBumpy(dist);
          else if (gameObject === fixThread) this.updateSkinFixed(dist);
        },
      });
    });
  }

  // [기존 물리 로직 100% 유지]
  updateSkinBumpy(distance) {
    const { dimpleIntensity, dimpleFrequency, skinDepthFix, maxDeformation } = this.config;
    const strength = Math.min(maxDeformation, Math.abs(distance) * dimpleIntensity);

    for (let i = 0; i < this.liftingSkin.vertices.length; i++) {
      const vertex = this.liftingSkin.vertices[i];
      const orig = this.originalVertices[i];
      const wave = Math.sin(orig.u * Math.PI * dimpleFrequency);
      const verticalDecay = Math.pow(1 - orig.v, skinDepthFix);
      const horizontalFocus = Math.cos((orig.u - 0.5) * Math.PI);

      vertex.y = orig.y + (wave - 0.5) * strength * verticalDecay * horizontalFocus;
    }
  }

  // 고정 실 물리 로직: 사다리꼴 변형 (상단 이동 제어 버전)
  updateSkinFixed(distance) {
    // 💡 이 값을 조절해서 기울기를 낮추세요.
    // 1.0 = 실과 1:1로 움직임 (매우 많이 기울어짐)
    // 0.3 = 실 이동량의 30%만 반영 (자연스럽고 쫀쫀한 느낌)

    for (let i = 0; i < this.fixSkin.vertices.length; i++) {
      const vertex = this.fixSkin.vertices[i];
      const orig = this.fixOriginalVertices[i];

      // (1 - orig.v)로 하단은 고정하되, stretchStrength로 전체적인 기울기 강도를 낮춤
      const horizontalShift = distance * (1 - orig.v) * this.config.fixedSkinStrength;

      vertex.x = orig.x + horizontalShift;
    }
  }
}
