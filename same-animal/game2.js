// 캔버스 초기화
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const messageElement = document.getElementById('message');

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

// 동물 종류 및 타일 배열
const animalTypes = ['elephant', 'fox', 'giraffe', 'koala', 'panda', 'puppy1', 'puppy2', 'tiger', 'rabbit', 'squirrel'];
const stageCount = [4, 6, 12, 16, 20];
let tiles = []; // 타일 배열

// 게임 상태
let isRunning = false;
let currentStage = 1; // 현재 스테이지
const maxStages = 5; // 최대 스테이지
let imagesLoadedCount = 0;
let isImgLoad = false;

let timer; // 타이머 ID
let timeRemaining; // 남은 시간


let audioCtx;
// 음소거 상태
let isMuted = false;
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let isMusicPlaying = false; // 음악 재생 상태


// 동물 이미지 설정
const animalImages = {
    elephant: new Image(),
    fox: new Image(),
    giraffe: new Image(),
    koala: new Image(),
    panda: new Image(),
    puppy1: new Image(),
    puppy2: new Image(),
    tiger: new Image(),
    rabbit: new Image(),
    squirrel: new Image(),
};

const hiddenCardImage = new Image(); // 숨겨진 카드 이미지
hiddenCardImage.src = "images/icon.png";

const totalImages = Object.keys(animalImages).length + 1;

animalImages.elephant.src = "images/elephant.png";
animalImages.fox.src = "images/fox.png";
animalImages.giraffe.src = "images/giraffe.png";
animalImages.koala.src = "images/koala.png";
animalImages.panda.src = "images/panda.png";
animalImages.puppy1.src = "images/puppy1.png";
animalImages.puppy2.src = "images/puppy2.png";
animalImages.tiger.src = "images/tiger.png";
animalImages.rabbit.src = "images/rabbit.png";
animalImages.squirrel.src = "images/squirrel.png";


function createBackgroundMusic() {
    if (isMuted) return;

    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // 오실레이터 설정
    oscillator1.type = 'sine'; // 파형 종류
    oscillator1.frequency.setValueAtTime(261.63, audioContext.currentTime); // C4 음
    oscillator2.type = 'triangle';
    oscillator2.frequency.setValueAtTime(329.63, audioContext.currentTime); // E4 음

    // 볼륨 조절
    gainNode.gain.setValueAtTime(0.01, audioContext.currentTime); // 소리 크기 조절

    // 연결
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // 멜로디 반복
    const melodyDuration = 2; // 2초
    const startTime = audioContext.currentTime;

    oscillator1.frequency.setValueAtTime(261.63, startTime); // C4
    oscillator2.frequency.setValueAtTime(329.63, startTime); // E4

    oscillator1.frequency.setValueAtTime(293.66, startTime + 0.5); // D4
    oscillator2.frequency.setValueAtTime(349.23, startTime + 0.5); // F4

    oscillator1.frequency.setValueAtTime(329.63, startTime + 1); // E4
    oscillator2.frequency.setValueAtTime(392.00, startTime + 1); // G4

    oscillator1.frequency.setValueAtTime(261.63, startTime + 1.5); // C4
    oscillator2.frequency.setValueAtTime(329.63, startTime + 1.5); // E4

    // 음악 시작
    oscillator1.start();
    oscillator2.start();

    // 2초 후에 반복하도록 설정
    setTimeout(() => {
        if (isMusicPlaying) {
            createBackgroundMusic(); // 재귀 호출로 반복
        }
    }, melodyDuration * 1000);

    // 음악 중지 시 오실레이터 정지
    oscillator1.stop(audioContext.currentTime + melodyDuration);
    oscillator2.stop(audioContext.currentTime + melodyDuration);
}

// 배경음악 토글
function toggleBackgroundMusic() {
    if (!isMusicPlaying) {
        isMusicPlaying = true;
        createBackgroundMusic();
    } else {
        isMusicPlaying = false;
        audioContext.close();
    }
}

// Web Audio API로 효과음 생성 함수
function playEffectSound(type) {
    if (isMuted) return;
    if (!audioCtx) initializeAudio();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'gameOver') {
        // 게임 오버 효과음 (하강 음계)
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.5); // A3
    } else if (type === 'clear') {
        // 클리어 효과음 (상승 음계)
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(330, audioCtx.currentTime); // E4
        gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(660, audioCtx.currentTime + 0.5); // E5
    } else if (type === 'select') {
        // 카드 선택 효과음 (짧고 단일 톤)
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime); // A4
        gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    } else if (type === 'match') {
        // 카드 페어 효과음 (상승 2음)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(330, audioCtx.currentTime); // E4
        gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(660, audioCtx.currentTime + 0.2); // E5
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    }

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5); // 0.5초 후 사운드 종료
}

function initializeAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        console.log('AudioContext 초기화 완료');
    }
}

// 게임 오버 효과음 호출
function playGameOverSound() {
    playEffectSound('gameOver');
}

// 클리어 효과음 호출
function playClearSound() {
    playEffectSound('clear');
}

// 예시: 게임 오버 시 효과음 재생
function gameOver() {
    playGameOverSound();

    currentStage = 1;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    drawMessage("Time's up! Game Over.");

    button.visible = true;
    drawButton(button);
}

// 예시: 클리어 시 효과음 재생
function stageClear() {
    playClearSound();

    if (currentStage < maxStages) {
        currentStage++;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        buttonNext.visible = true;

        drawMessage(`스테이지 ${currentStage - 1} 완료! 다음 스테이지로 진행하려면 버튼을 클릭하세요.`)
        drawButton(buttonNext);


    } else {
        drawMessage('모든 스테이지 완료! 축하합니다!');
        currentStage = 1;
        drawButton(button);
    }
}

// 카드 선택 효과음
function playSelectSound() {
    playEffectSound('select');
}

// 카드 페어 효과음
function playMatchSound() {
    playEffectSound('match');
}

// 캔버스 왼쪽 아래 버튼 크기 및 위치
const muteButton = {
    x: 10, // 캔버스 왼쪽 아래 위치
    y: canvas.height - 50,
    width: 40,
    height: 40,
};

// 음소거 버튼 그리기
function drawMuteButton() {
    ctx.fillStyle = isMuted ? 'gray' : 'lightgreen'; // 음소거 시 회색, 활성화 시 연두색
    ctx.fillRect(muteButton.x, muteButton.y, muteButton.width, muteButton.height);

    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isMuted ? '🔇' : '🔊', muteButton.x + muteButton.width / 2, muteButton.y + muteButton.height / 2);
}

// 음소거 상태 변경
function toggleMute() {
    isMuted = !isMuted;
    ctx.clearRect(muteButton.x, muteButton.y, muteButton.width, muteButton.height);
    drawMuteButton();
}


// 버튼 위치와 크기
const button = {
    x: canvasWidth / 2 - 50,
    y: canvasHeight / 2 - 30,
    width: 100,
    height: 40,
    text: 'START',
    visible: true
};

const buttonNext = {
    x: canvasWidth / 2 - 100,
    y: canvasHeight / 2 - 30,
    width: 200,
    height: 40,
    text: 'NEXT STAGE',
    visible: true

};

// 버튼 그리기
function drawButton(buttonType) {
    if (!buttonType.visible) return;

    ctx.fillStyle = 'black';
    ctx.fillRect(buttonType.x, buttonType.y, buttonType.width, buttonType.height);

    ctx.fillStyle = 'white';
    ctx.font = '25px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(buttonType.text, buttonType.x + buttonType.width / 2, buttonType.y + buttonType.height / 2);
}


// 이미지 로드 상태 추적
function checkAllImagesLoaded() {
    imagesLoadedCount++;
    if (imagesLoadedCount === totalImages) {
        isImgLoad = true;
        drawButton(button);
        drawMuteButton();
    }
}

// 각 이미지의 onload 이벤트 핸들러 설정
Object.keys(animalImages).forEach((key) => {
    animalImages[key].onload = checkAllImagesLoaded;
});
hiddenCardImage.onload = checkAllImagesLoaded;

// 게임 시작
function startGame() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    drawMuteButton();
    if (!isRunning) {
        isRunning = true;
        // startButton.disabled = true;
        messageElement.innerHTML = `STAGE${currentStage}`;

        if (isImgLoad) {
            toggleBackgroundMusic();
            generateTilePairs();
            revealAllTiles();
            drawTiles();
            timeRemaining = 30; // 초기 타이머 시간 설정 (30초)
            setTimeout(() => {
                hideAllTiles(); // 2초 뒤 타일 숨기기
                startTimer();
                gameLoop();
            }, 2000);
        }
    }
}

// 타이머 시작
function startTimer() {
    clearInterval(timer); // 기존 타이머 초기화
    timer = setInterval(() => {
        timeRemaining--;
        if (timeRemaining <= 0) {
            endGame(false); // 시간 초과 시 게임 종료
        }
    }, 1000);
}

// 타이머 중지
function stopTimer() {
    clearInterval(timer);
}

// 스테이지에 따른 타일 생성
function generateTilePairs() {
    tiles = []; // 이전 타일 초기화

    // 현재 스테이지에 따른 동물 쌍 수 계산
    const pairs = Math.min(stageCount[currentStage - 1], animalTypes.length * 2);

    // 동물 타입마다 2개씩 타일을 생성
    for (let i = 0; i < pairs / 2; i++) {
        const type = animalTypes[i % animalTypes.length];
        for (let j = 0; j < 2; j++) {
            tiles.push({
                x: 0, // 초기 위치
                y: 0, // 초기 위치
                type,
                width: 80,
                height: 80,
                selected: false, // 선택 여부
                revealed: false, //타일 초기 상태 : 숨겨짐
            });
        }
    }

    // 타일 섞기
    shuffleTiles();

    // 캔버스 중앙에 정렬
    arrangeTilesInCenter();
}

// 타일 섞기
function shuffleTiles() {
    for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]]; // 타일 위치 교환
    }
}

// 타일을 캔버스 중앙에 배치
function arrangeTilesInCenter() {
    const rows = Math.ceil(Math.sqrt(tiles.length)); // 줄의 수
    const cols = Math.ceil(tiles.length / rows); // 칸의 수
    const tileWidth = 80;
    const tileHeight = 80;
    const spacing = 10; // 타일 간 간격

    // 전체 타일의 크기를 계산
    const totalWidth = cols * tileWidth + (cols - 1) * spacing;
    const totalHeight = rows * tileHeight + (rows - 1) * spacing;

    // 시작 좌표 계산 (캔버스 중앙 기준)
    const startX = (canvasWidth - totalWidth) / 2;
    const startY = (canvasHeight - totalHeight) / 2;

    let currentX = startX;
    let currentY = startY;

    // 타일 위치 지정
    tiles.forEach((tile, index) => {
        tile.x = currentX;
        tile.y = currentY;

        currentX += tileWidth + spacing;

        if ((index + 1) % cols === 0) { // 한 줄이 끝나면 다음 줄로
            currentX = startX;
            currentY += tileHeight + spacing;
        }
    });
}

// 모든 타일 공개
function revealAllTiles() {
    tiles.forEach(tile => tile.revealed = true);
}

// 모든 타일 숨기기
function hideAllTiles() {
    tiles.forEach(tile => tile.revealed = false);
}

// 게임 루프
function gameLoop() {
    if (!isRunning) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    drawTimer(); // 타이머 그리기
    drawTiles();
    drawMuteButton();

    requestAnimationFrame(gameLoop);
}

// 타이머 그리기
function drawTimer() {
    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.clearRect(0, 0, canvasWidth, 30); // 타이머 영역 지우기
    ctx.fillText(`Time Left: ${timeRemaining}s`, 100, 20);
}

// 타일 그리기
function drawTiles() {
    tiles.forEach(tile => {
        const img = tile.revealed ? animalImages[tile.type] : hiddenCardImage; //선택에 따라 이미지 결정
        ctx.drawImage(img, tile.x, tile.y, tile.width, tile.height);

        ctx.strokeStyle = tile.selected ? 'red' : 'black';
        ctx.lineWidth = tile.selected ? 4 : 1;

        ctx.strokeRect(tile.x, tile.y, tile.width, tile.height);
    });
}

function drawMessage(message) {
    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.clearRect(0, 0, canvasWidth, 30);
    ctx.fillText(`${message}`, 300, 20);
}

// 마우스 클릭 이벤트
let selectedTiles = [];
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    initializeAudio();

    if (isRunning) {
        handleTileClick(mouseX, mouseY);
    }
    else if (mouseX >= button.x &&
        mouseX <= button.x + button.width &&
        mouseY >= button.y &&
        mouseY <= button.y + button.height) {
        startGame();
    }

    if (mouseX >= muteButton.x &&
        mouseX <= muteButton.x + muteButton.width &&
        mouseY >= muteButton.y &&
        mouseY <= muteButton.y + muteButton.height) {
        toggleMute();
    }
});

// 충돌 체크
function checkCollision(mouseX, mouseY) {
    return tiles.find(tile =>
        mouseX >= tile.x && mouseX <= tile.x + tile.width &&
        mouseY >= tile.y && mouseY <= tile.y + tile.height
    );
}

function handleTileClick(mouseX, mouseY) {
    const clickedTile = checkCollision(mouseX, mouseY);
    if (clickedTile && !clickedTile.revealed) {
        toggleTileSelection(clickedTile);

        if (selectedTiles.length === 2) {
            checkPair();
        }
    }
}

// 타일 선택/해제
function toggleTileSelection(tile) {
    playSelectSound();
    if (tile.selected) {
        tile.selected = false;
        selectedTiles = selectedTiles.filter(t => t !== tile);
    } else if (selectedTiles.length < 2) {
        tile.selected = true;
        tile.revealed = true;
        selectedTiles.push(tile);
    }
}

// 쌍 체크
function checkPair() {
    const [tile1, tile2] = selectedTiles;
    if (tile1.type === tile2.type) {
        animateMatchedTile(tile1);
        animateMatchedTile(tile2);
        removeTile(tile1);
        removeTile(tile2);
        playMatchSound();
    } else {
        setTimeout(() => {
            tile1.revealed = false; //다시 숨김
            tile2.revealed = false;
        }, 1000);
    }

    selectedTiles.forEach(tile => tile.selected = false);
    selectedTiles = [];

    if (tiles.length === 0) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        endGame(true);
    }
}

// 타일 제거
function removeTile(tile) {
    const index = tiles.indexOf(tile);
    if (index > -1) {
        tiles.splice(index, 1);
    }
}

// 스테이지 종료
function endGame(success) {
    stopTimer();
    setTimeout(() => {
        if (success) {
            stageClear();
        }
        else {
            gameOver();
        }
    }, 1000);
    isMusicPlaying = false;
    isRunning = false;
    drawMuteButton();
}

// 카드 매칭 애니메이션 추가
function animateMatchedTile(tile) {
    const animationDuration = 500; // 500ms
    let startTime;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;

        const scale = 1 + 0.5 * Math.sin((progress / animationDuration) * Math.PI);
        ctx.save();
        ctx.translate(tile.x + tile.width / 2, tile.y + tile.height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-(tile.x + tile.width / 2), -(tile.y + tile.height / 2));
        ctx.drawImage(animalImages[tile.type], tile.x, tile.y, tile.width, tile.height);
        ctx.restore();

        if (progress < animationDuration) {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
}


// 추가사항
// 조금 꾸미기
// 광고 넣기