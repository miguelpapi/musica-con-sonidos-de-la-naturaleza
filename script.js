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
      audio.play();
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

// Grabacion
let mediaRecorder;
let recordedChunks = [];

document.getElementById("startRecording").onclick = async () => {
  try {
    // Crear contexto de audio
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Crear destino para grabar
    const dest = audioContext.createMediaStreamDestination();

    // Conectar todos los sonidos al destino
    audioElements.forEach(audio => {
      const source = audioContext.createMediaElementSource(audio);
      source.connect(dest);
      source.connect(audioContext.destination); // Para que siga sonando en los parlantes
    });

    // Obtener el micrófono
    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const micSource = audioContext.createMediaStreamSource(audioContext.createMediaStreamDestination().stream);

    // Mezclar micrófono y sonidos
    const combinedStream = new MediaStream([
      ...dest.stream.getAudioTracks(),
      ...micStream.getAudioTracks()
    ]);

    mediaRecorder = new MediaRecorder(combinedStream);

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) recordedChunks.push(e.data);
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
    document.getElementById("startRecording").disabled = true;
    document.getElementById("stopRecording").disabled = false;
  } catch (err) {
    alert("Error al acceder al microfono: " + err.message);
  }
};

document.getElementById("stopRecording").onclick = () => {
  mediaRecorder.stop();
  document.getElementById("startRecording").disabled = false;
  document.getElementById("stopRecording").disabled = true;
};
