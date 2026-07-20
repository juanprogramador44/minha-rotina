/* ==========================================================================
   MINHA ROTINA - INDEPENDENT UTILITY FUNCTIONS
   ========================================================================== */

const MOTIVATIONAL_QUOTES = [
    "Progresso é melhor do que perfeição. Dê o primeiro passo.",
    "Organize uma coisa por vez. Foque no agora.",
    "Você já começou, isso é o que importa. Continue firme!",
    "Vamos focar na próxima tarefa. O passado já passou.",
    "Um pequeno passo hoje é a base de uma grande conquista amanhã.",
    "Respire fundo, afaste as distrações e volte ao fluxo.",
    "A disciplina é a ponte entre metas e realizações."
];

// Sound Synthesizer via Web Audio API
export function playChime(type = 'success') {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        if (type === 'success') {
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
        } else if (type === 'info') {
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.1);
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.8);
        }
    } catch (e) {
        console.warn("Navegador bloqueou áudio ou Web Audio API indisponível.", e);
    }
}

// Global Motivational Quotes Selector
export function getRandomQuote() {
    const idx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    return MOTIVATIONAL_QUOTES[idx];
}

// Format date in Portuguese
export function formatDate(date) {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    let d = date.toLocaleDateString('pt-BR', options);
    return d.split(' ').map(word => {
        if (word.length > 2) {
            return word.charAt(0).toUpperCase() + word.slice(1);
        }
        return word;
    }).join(' ');
}
