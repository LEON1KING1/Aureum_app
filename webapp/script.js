const timerDisplay = document.getElementById('timer');
let totalSeconds = 24 * 60 * 60;

function updateTimer() {
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  timerDisplay.textContent = `${hours}:${minutes}:${seconds}`;
  timerDisplay.style.transform = 'scale(1.1)';
  setTimeout(() => timerDisplay.style.transform = 'scale(1)', 150);
  totalSeconds = (totalSeconds - 1 + 24 * 60 * 60) % (24 * 60 * 60);
}
setInterval(updateTimer, 1000);
updateTimer();

document.getElementById('mine').onclick = () => {
  alert('Mining started! Rewards accumulating...');
};
