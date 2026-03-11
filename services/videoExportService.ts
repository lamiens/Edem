import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { GeneratedStory } from '@/types';

async function imageToBase64(uri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/png;base64,${base64}`;
  } catch {
    return '';
  }
}

async function audioToBase64(uri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:audio/mp3;base64,${base64}`;
  } catch {
    return '';
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

export async function exportStoryAsVideo(
  story: GeneratedStory,
  audioUris: (string | undefined)[],
  onProgress?: (step: string) => void
): Promise<string> {
  onProgress?.('Préparation des images...');

  const imageData: string[] = [];
  for (const chapter of story.chapters) {
    if (chapter.imageUri) {
      imageData.push(await imageToBase64(chapter.imageUri));
    } else {
      imageData.push('');
    }
  }

  let photoBase64 = '';
  if (story.answers.photoUri) {
    photoBase64 = await imageToBase64(story.answers.photoUri);
  }

  onProgress?.('Préparation de l\'audio...');

  const audioData: string[] = [];
  for (const uri of audioUris) {
    if (uri) {
      audioData.push(await audioToBase64(uri));
    } else {
      audioData.push('');
    }
  }

  onProgress?.('Création du fichier...');

  const chaptersJson = JSON.stringify(
    story.chapters.map((ch, i) => ({
      title: ch.title,
      text: ch.text,
      image: imageData[i],
      audio: audioData[i],
      illustration: ch.illustration,
    }))
  );

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>${escapeHtml(story.title)} - Edem</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#1a0a2e;color:#fff;overflow:hidden;height:100vh;width:100vw}
.slide{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;transition:opacity 0.8s ease;pointer-events:none;padding:20px}
.slide.active{opacity:1;pointer-events:all}
.cover{background:linear-gradient(135deg,${story.coverColor},${story.coverColor}bb,#1a0a2e)}
.cover .photo{width:120px;height:120px;border-radius:50%;border:4px solid rgba(255,255,255,0.4);object-fit:cover;margin-bottom:20px}
.cover .emoji-photo{font-size:60px;margin-bottom:20px}
.cover h1{font-size:28px;text-align:center;line-height:1.3;text-shadow:0 2px 8px rgba(0,0,0,0.3);margin-bottom:10px}
.cover .meta{font-size:16px;opacity:0.8;margin-bottom:6px}
.cover .hero-name{font-size:14px;opacity:0.6;margin-bottom:30px}
.cover .label{font-size:12px;letter-spacing:3px;text-transform:uppercase;opacity:0.5;margin-bottom:20px}
.chapter{background:linear-gradient(180deg,#0f0520 0%,#1a0a2e 100%);overflow-y:auto}
.ch-header{width:100%;padding:16px 20px;border-radius:16px;text-align:center;margin-bottom:16px}
.ch-num{font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:0.7;margin-bottom:4px}
.ch-title{font-size:20px;font-weight:800}
.ch-img{width:100%;max-width:400px;border-radius:14px;border:3px solid #2D1B0E;margin-bottom:16px;max-height:220px;object-fit:cover}
.ch-placeholder{width:100%;max-width:400px;border-radius:14px;border:2px dashed rgba(255,255,255,0.2);padding:30px;text-align:center;margin-bottom:16px;background:rgba(255,255,255,0.05)}
.ch-placeholder .icon{font-size:40px;margin-bottom:8px}
.ch-placeholder .desc{font-size:13px;opacity:0.5;font-style:italic}
.ch-text{font-size:16px;line-height:1.7;max-width:500px;text-align:justify;padding:0 10px}
.ch-text p{margin-bottom:12px}
.end{background:linear-gradient(135deg,#6B4CE6,#FF6B9D)}
.end .fin-emoji{font-size:56px;margin-bottom:12px}
.end h2{font-size:36px;font-weight:900;margin-bottom:14px}
.end .moral{font-size:18px;font-style:italic;text-align:center;line-height:1.5;opacity:0.9;max-width:400px}
.end .brand{margin-top:30px;font-size:13px;opacity:0.5}
.controls{position:fixed;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:16px;padding:14px 20px;background:rgba(0,0,0,0.7);backdrop-filter:blur(10px);z-index:100}
.controls button{border:none;border-radius:50%;width:44px;height:44px;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform 0.15s}
.controls button:active{transform:scale(0.9)}
.btn-play{background:linear-gradient(135deg,#FFD93D,#FF8C42);color:#2D1B0E}
.btn-nav{background:rgba(255,255,255,0.15);color:#fff}
.progress{flex:1;height:4px;background:rgba(255,255,255,0.15);border-radius:2px;max-width:200px}
.progress-fill{height:100%;background:#FFD93D;border-radius:2px;transition:width 0.3s}
.dots{display:flex;gap:6px;align-items:center}
.dot{width:8px;height:8px;border-radius:4px;background:rgba(255,255,255,0.25);transition:all 0.3s}
.dot.active{width:20px;background:${story.coverColor}}
</style>
</head>
<body>
<div id="app"></div>
<div class="controls">
  <button class="btn-nav" onclick="prev()">◀</button>
  <div class="dots" id="dots"></div>
  <button class="btn-play" id="playBtn" onclick="togglePlay()">▶</button>
  <button class="btn-nav" onclick="next()">▶</button>
</div>
<script>
const chapters=${chaptersJson};
const storyTitle="${escapeHtml(story.title)}";
const regionEmoji="${story.answers.region?.emoji || '🌍'}";
const regionName="${escapeHtml(story.answers.region?.name || '')}";
const heroName="${escapeHtml(story.answers.heroName)}";
const moral="${escapeHtml(story.answers.moral)}";
const coverColor="${story.coverColor}";
const photoBase64="${photoBase64}";

const colors=[["#FF8C42","#FFD93D"],["#6B4CE6","#6EC6FF"],["#10B981","#4ADE80"],["#FF6B9D","#FF8C42"]];
let current=0;
let playing=false;
let audioEl=null;
const totalSlides=chapters.length+2;

function buildSlides(){
  const app=document.getElementById('app');
  // Cover
  let coverPhoto=photoBase64?'<img class="photo" src="'+photoBase64+'">':'<div class="emoji-photo">📖</div>';
  app.innerHTML+='<div class="slide cover" id="slide0">'+
    '<div class="label">Un livre Edem</div>'+coverPhoto+
    '<h1>'+storyTitle+'</h1>'+
    '<div class="meta">'+regionEmoji+' '+regionName+'</div>'+
    '<div class="hero-name">Avec '+heroName+' comme héros</div></div>';
  
  // Chapters
  chapters.forEach((ch,i)=>{
    const c=colors[i%colors.length];
    const imgHtml=ch.image?'<img class="ch-img" src="'+ch.image+'">':
      '<div class="ch-placeholder"><div class="icon">🎨</div><div class="desc">'+ch.illustration+'</div></div>';
    const paragraphs=ch.text.split('\\n\\n').map(p=>'<p>'+p+'</p>').join('');
    app.innerHTML+='<div class="slide chapter" id="slide'+(i+1)+'">'+
      '<div class="ch-header" style="background:linear-gradient(135deg,'+c[0]+','+c[1]+')">'+
      '<div class="ch-num">Chapitre '+(i+1)+'</div>'+
      '<div class="ch-title">'+ch.title+'</div></div>'+
      imgHtml+'<div class="ch-text">'+paragraphs+'</div></div>';
  });

  // End
  app.innerHTML+='<div class="slide end" id="slide'+(chapters.length+1)+'">'+
    '<div class="fin-emoji">🌟</div><h2>Fin</h2>'+
    '<div class="moral">« '+moral+' »</div>'+
    '<div class="brand">Créé avec Edem ✨</div></div>';

  // Dots
  const dots=document.getElementById('dots');
  for(let i=0;i<totalSlides;i++){
    dots.innerHTML+='<div class="dot'+(i===0?' active':'')+'" id="dot'+i+'"></div>';
  }
  
  document.getElementById('slide0').classList.add('active');
}

function goTo(n){
  if(n<0||n>=totalSlides)return;
  document.getElementById('slide'+current).classList.remove('active');
  document.getElementById('dot'+current).classList.remove('active');
  current=n;
  document.getElementById('slide'+current).classList.add('active');
  document.getElementById('dot'+current).classList.add('active');
}

function next(){goTo(current+1)}
function prev(){goTo(current-1)}

function togglePlay(){
  if(playing){stopPlay();return}
  playing=true;
  document.getElementById('playBtn').textContent='⏸';
  playFromCurrent();
}

function stopPlay(){
  playing=false;
  document.getElementById('playBtn').textContent='▶';
  if(audioEl){audioEl.pause();audioEl=null}
}

function playFromCurrent(){
  if(!playing)return;
  if(current===0){next();setTimeout(()=>playFromCurrent(),800);return}
  const chIdx=current-1;
  if(chIdx>=chapters.length){stopPlay();return}
  const ch=chapters[chIdx];
  if(ch.audio){
    audioEl=new Audio(ch.audio);
    audioEl.playbackRate=1.0;
    audioEl.onended=()=>{
      if(!playing)return;
      next();
      setTimeout(()=>playFromCurrent(),600);
    };
    audioEl.play().catch(()=>{
      setTimeout(()=>{next();playFromCurrent()},4000);
    });
  } else {
    setTimeout(()=>{if(!playing)return;next();playFromCurrent()},5000);
  }
}

buildSlides();
</script>
</body>
</html>`;

  const dir = `${FileSystem.documentDirectory}edem_exports/`;
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }

  const filePath = `${dir}${story.id}.html`;
  await FileSystem.writeAsStringAsync(filePath, html, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return filePath;
}

export async function shareStoryVideo(filePath: string): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/html',
      dialogTitle: 'Partager mon histoire Edem',
      UTI: 'public.html',
    });
  }
}
