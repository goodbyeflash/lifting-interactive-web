import { Scene } from 'phaser';
import { updateExternalNav } from '../../utils/navigation'; // 공통 유틸 사용

export class Home extends Scene {
  constructor() {
    super('Home');
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;

    this.cameras.main.setBackgroundColor('#ffffff');

    // 로고 텍스트 혹은 메인 포인트 (아이콘 대신 텍스트로 임시 대체 가능)
    this.add.image(centerX, 260, 'logo').setOrigin(0.5).setScale(1.25);

    // 2. 네비게이션 카드 데이터
    const screenData = [
      { id: 1, key: 'Scene1', title: '시뮬레이션1', desc: '설명1' },
      { id: 2, key: 'Scene2', title: '시뮬레이션2', desc: '설명2' },
      { id: 3, key: 'Scene3', title: '시뮬레이션3', desc: '설명3' },
    ];

    // 3. 카드 생성 루프 (간격 조정: 140 -> 180)
    screenData.forEach((data, index) => {
      const cardY = 550 + index * 180;
      this.createNavigationCard(centerX, cardY, data);
    });
  }

  createNavigationCard(x, y, data) {
    const cardWidth = 660; // 너비 약간 증가
    const cardHeight = 150; // 높이 대폭 증가 (110 -> 150)

    const container = this.add.container(x, y);

    // 카드 배경 (Rounded Rect)
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 1);
    bg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 32);
    bg.lineStyle(1.5, 0xa8c5de, 0.25);
    bg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 32);

    // 아이콘 영역 삭제에 따라 텍스트를 중앙 정렬에 가깝게 배치
    const textLeftMargin = -cardWidth / 2 + 50;

    // 텍스트 (Title) - 가독성을 위해 크기 및 두께 강조
    const titleText = this.add.text(textLeftMargin, -40, data.title, {
      fontSize: '34px',
      fontFamily: 'Pretendard, Arial',
      color: '#1f2937',
    });

    // 텍스트 (Description) - 크기 증가 및 명도 조정
    const descText = this.add.text(textLeftMargin, 10, data.desc, {
      fontSize: '22px',
      fontFamily: 'Pretendard, Arial',
      color: '#6b7280',
    });

    // 화살표 아이콘 모양 (우측 끝에 배치하여 버튼 느낌 강조)
    const arrow = this.add
      .text(cardWidth / 2 - 60, 0, '>', {
        fontSize: '40px',
        fontFamily: 'Pretendard, Arial',
        color: '#a8c5de',
      })
      .setOrigin(0.5);

    container.add([bg, titleText, descText, arrow]);

    // 인터랙션 설정
    const hitArea = new Phaser.Geom.Rectangle(
      -cardWidth / 2,
      -cardHeight / 2,
      cardWidth,
      cardHeight,
    );
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    // 피드백 효과
    container.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.02, duration: 100 });
      bg.clear();
      bg.fillStyle(0xf9fafb, 1); // 호버 시 배경색 살짝 변경
      bg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 32);
      bg.lineStyle(2, 0xa8c5de, 0.5);
      bg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 32);
    });

    container.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1.0, duration: 100 });
      bg.clear();
      bg.fillStyle(0xffffff, 1);
      bg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 32);
      bg.lineStyle(1.5, 0xa8c5de, 0.25);
      bg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 32);
    });

    // 클릭 시 이동
    container.on('pointerdown', () => {
      updateExternalNav(data.key); // 유틸리티 함수 호출
      this.scene.start(data.key);
    });
  }
}
