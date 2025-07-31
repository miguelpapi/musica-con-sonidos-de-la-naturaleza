const sounds = [
  { name: "Lluvia", file: "sounds/lluvia.mp3" },
  { name: "Bosque", file: "sounds/bosque.mp3" },
  { name: "Pajaros", file: "sounds/pajaros.mp3" },
  { name: "Rio", file: "sounds/rio.mp3" },
  { name: "Truenos", file: "sounds/truenos.mp3" }
];

const soundboard = document.getElementById("soundboard");
const audioElements = [];
const playButtons = [];

// Contexto de audio
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const audioSourceNodes = [];

// ✅ Desbloquear audio al primer clic
document.body.addEventListener("click", () => {
  if (audioContext.state === "suspended") {
    audioContext.resume();
    console.log("AudioContext desbloqueado");
  }
});

// Crear botones y sonidos
sounds.forEach((sound, index) => {
  const container = document.createElement("div");
  container.className = "sound";

  const title = document.createElement("h2");
  title.textContent = sound.name;

  const audio = new Audio(sound.file);
  audio.loop = true;

  const playBtn = document.createElement("button");
  playBtn.textContent = "Reproducir";
  playBtn.classList.add("play-button");

  playBtn.onclick = () => {
    if (audio.paused) {
      audio.play().catch(err => console.error("Error al reproducir:", err));
      playBtn.textContent = "Pausar";
    } else {
      audio.pause();
      playBtn.textContent = "Reproducir";
    }
  };

  const volume = document.createElement("input");
  volume.type = "range";
  volume.min = 0;
  volume.max = 1;
  volume.step = 0.01;
  volume.value = localStorage.getItem(`vol-${index}`) || 0.5;
  audio.volume = volume.value;
  volume.oninput = () => {
    audio.volume = volume.value;
    localStorage.setItem(`vol-${index}`, volume.value);
  };

  const controls = document.createElement("div");
  controls.className = "controls";
  controls.appendChild(playBtn);
  controls.appendChild(volume);

  container.appendChild(title);
  container.appendChild(controls);
  soundboard.appendChild(container);

  audioElements.push(audio);

  const sourceNode = audioContext.createMediaElementSource(audio);
  audioSourceNodes.push(sourceNode);
  sourceNode.connect(audioContext.destination);

  playButtons.push(playBtn);
});

// Detener todos
document.getElementById("stopAll").onclick = () => {
  audioElements.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
  playButtons.forEach(btn => {
    btn.textContent = "Reproducir";
  });
};

// Tema claro/oscuro
document.getElementById("toggleTheme").onclick = () => {
  document.body.classList.toggle("dark");
};

// Grabación
let mediaRecorder;
let recordedChunks = [];

document.getElementById("startRecording").onclick = async () => {
  try {
    const dest = audioContext.createMediaStreamDestination();

    // Conectar sonidos al destino de grabación
    audioSourceNodes.forEach(sourceNode => {
      try { sourceNode.connect(dest); } catch (e) {}
    });

    // Obtener micrófono
    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const micSource = audioContext.createMediaStreamSource(micStream);
    micSource.connect(dest);

    // Crear MediaRecorder
    const combinedStream = dest.stream;
    mediaRecorder = new MediaRecorder(combinedStream);

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
        console.log("Chunk grabado:", e.data.size);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);

      const li = document.createElement("li");
      const audio = document.createElement("audio");
      const link = document.createElement("a");

      audio.controls = true;
      audio.src = url;

      link.href = url;
      link.download = `grabacion-${Date.now()}.webm`;
      link.textContent = "Descargar";

      li.appendChild(audio);
      li.appendChild(document.createElement("br"));
      li.appendChild(link);
      document.getElementById("recordingsList").appendChild(li);

      recordedChunks = [];
    };

    mediaRecorder.start();
    console.log("Grabación iniciada...");
    document.getElementById("startRecording").disabled = true;
    document.getElementById("stopRecording").disabled = false;
  } catch (err) {
    alert("Error al acceder al micrófono: " + err.message);
    console.error(err);
  }
};

document.getElementById("stopRecording").onclick = () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    console.log("Grabación detenida.");
    document.getElementById("startRecording").disabled = false;
    document.getElementById("stopRecording").disabled = true;
  }
};
