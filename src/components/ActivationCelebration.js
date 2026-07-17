import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';

// DigiByte-flavoured party palette (blue + accents).
const PALETTE = ['#0066cc', '#4caf50', '#ffd54f', '#ff7043', '#26c6da', '#ab47bc', '#ffffff', '#ff4081', '#00e5ff'];
const DURATION = 30000;        // ms the show actively spawns particles/rockets (30 seconds)
const FADE = 1500;             // ms fade-out after the show ends
const ROCKET_DELAY_MS = 5000;  // DGB logo rocket ignites 5s into the show
const ROCKET_FLIGHT_SECS = 10; // slow, majestic lift-off (2s shake + 8s ascent)

const rand = (min, max) => Math.random() * (max - min) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ---------------------------------------------------------------------------
// Web Audio helpers — all sounds are synthesized (no audio assets). Browsers
// gate audio behind a user gesture; ensureAudio() best-effort resumes the
// context and the overlay also listens for the first pointer/key event to
// unlock it. Every call is wrapped so missing/blocked audio can never break
// the visual show.
// ---------------------------------------------------------------------------
function ensureAudio(ref) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ref.current || ref.current.state === 'closed') ref.current = new AC();
    if (ref.current.state === 'suspended') ref.current.resume().catch(() => {});
    return ref.current;
  } catch (e) {
    return null;
  }
}

/**
 * Rocket lift-off: a proper roaring engine, layered like the real thing —
 *  1. brown-noise thunder (deep rumble, most of the energy below ~250 Hz)
 *  2. distorted mid-band roar (white noise → bandpass → tanh waveshaper)
 *  3. combustion crackle (sparse impulse train, the F-1-style pop/crackle)
 *  4. sub-bass thump (~42 Hz sine with slow wobble, drops as it departs)
 * All layers ride one master envelope: ignition slam over ~0.35s, full
 * throttle through lift-off, then a long receding fade (lowpass closing +
 * pitch dropping) as the rocket climbs away. Runs the whole 10s flight.
 */
function playLaunchSound(ref) {
  const ctx = ensureAudio(ref);
  // A suspended context freezes currentTime — sounds scheduled on it would all
  // fire in a burst on resume. Only play when audio is actually unlocked.
  if (!ctx || ctx.state !== 'running') return;
  try {
    const t = ctx.currentTime;
    // Covers the whole sequence: 5s roaring on the pad, 10s flight, fading
    // out as the rocket recedes.
    const DUR = 16;
    const sr = ctx.sampleRate;

    // Master: envelope -> compressor (glues layers, stops clipping) -> out
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 12;
    comp.ratio.value = 6;
    comp.attack.value = 0.005;
    comp.release.value = 0.2;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, t);
    master.gain.exponentialRampToValueAtTime(0.9, t + 0.4);  // ignition slam
    master.gain.setValueAtTime(0.9, t + 11);                 // full throttle
    master.gain.exponentialRampToValueAtTime(0.0001, t + DUR); // climbs away
    master.connect(comp);
    comp.connect(ctx.destination);

    // Soft-clip waveshaper — turns noise into a saturated ROAR
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      const x = (i / 511.5) - 1;
      curve[i] = Math.tanh(2.5 * x);
    }
    shaper.curve = curve;
    shaper.connect(master);

    // 1. Brown-noise thunder — integrated white noise, huge low end
    const brownBuf = ctx.createBuffer(1, Math.floor(sr * DUR), sr);
    const bd = brownBuf.getChannelData(0);
    let lastB = 0;
    for (let i = 0; i < bd.length; i++) {
      const w = Math.random() * 2 - 1;
      lastB = (lastB + 0.02 * w) / 1.02;
      bd[i] = lastB * 3.5;
    }
    const brown = ctx.createBufferSource();
    brown.buffer = brownBuf;
    const rumbleLp = ctx.createBiquadFilter();
    rumbleLp.type = 'lowpass';
    rumbleLp.frequency.setValueAtTime(420, t);
    rumbleLp.frequency.linearRampToValueAtTime(300, t + 11);
    rumbleLp.frequency.linearRampToValueAtTime(90, t + DUR); // receding
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 1.0;
    brown.connect(rumbleLp); rumbleLp.connect(rumbleGain); rumbleGain.connect(shaper);
    brown.start(t); brown.stop(t + DUR);

    // 2. Mid-band roar — white noise, bandpassed, into the same distortion
    const whiteBuf = ctx.createBuffer(1, Math.floor(sr * DUR), sr);
    const wd = whiteBuf.getChannelData(0);
    for (let i = 0; i < wd.length; i++) wd[i] = Math.random() * 2 - 1;
    const white = ctx.createBufferSource();
    white.buffer = whiteBuf;
    const roarBp = ctx.createBiquadFilter();
    roarBp.type = 'bandpass';
    roarBp.frequency.setValueAtTime(520, t);
    roarBp.frequency.linearRampToValueAtTime(300, t + DUR);
    roarBp.Q.value = 0.55;
    const roarGain = ctx.createGain();
    roarGain.gain.value = 0.5;
    white.connect(roarBp); roarBp.connect(roarGain); roarGain.connect(shaper);
    white.start(t); white.stop(t + DUR);

    // 3. Combustion crackle — sparse impulses with fast decays, bandpassed
    const crackBuf = ctx.createBuffer(1, Math.floor(sr * DUR), sr);
    const cd = crackBuf.getChannelData(0);
    let env = 0;
    for (let i = 0; i < cd.length; i++) {
      if (Math.random() < 0.0011) env = Math.random() * 1.6;
      env *= 0.994;
      cd[i] = (Math.random() * 2 - 1) * env;
    }
    const crackle = ctx.createBufferSource();
    crackle.buffer = crackBuf;
    const crackBp = ctx.createBiquadFilter();
    crackBp.type = 'bandpass';
    crackBp.frequency.value = 2400;
    crackBp.Q.value = 0.7;
    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0.55, t);
    crackGain.gain.linearRampToValueAtTime(0.2, t + DUR); // crackle recedes too
    crackle.connect(crackBp); crackBp.connect(crackGain); crackGain.connect(master);
    crackle.start(t); crackle.stop(t + DUR);

    // 4. Sub-bass thump — chest hit, slow wobble, pitch drops as it departs
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(45, t);
    sub.frequency.linearRampToValueAtTime(42, t + 11);
    sub.frequency.linearRampToValueAtTime(28, t + DUR);
    const wob = ctx.createOscillator();
    wob.type = 'sine';
    wob.frequency.value = 9;
    const wobGain = ctx.createGain();
    wobGain.gain.value = 5;
    wob.connect(wobGain); wobGain.connect(sub.frequency);
    const subGain = ctx.createGain();
    subGain.gain.value = 0.35;
    sub.connect(subGain); subGain.connect(master);
    sub.start(t); sub.stop(t + DUR);
    wob.start(t); wob.stop(t + DUR);
  } catch (e) { /* audio unavailable — visuals carry on */ }
}

/**
 * ActivationCelebration — full-screen, click-through overlay: a 30-second
 * party (dense confetti, continuous firework volleys, rising balloons, a big
 * DGB-logo rocket that ignites 5 seconds in and climbs slowly up through the
 * middle with a synthesized launch rumble, and a big flashing banner). It runs
 * for every visitor while DigiDollar is ACTIVE (trigger logic lives in
 * DDActivationPage).
 *
 * Zero external dependencies: a single <canvas> drives confetti + firework
 * particles; balloons and the rocket are CSS-animated DOM nodes; all sounds
 * are Web-Audio-synthesized. It honours the user's prefers-reduced-motion
 * setting by dropping the heavy motion + audio and just showing the
 * (non-flashing) banner. The overlay is aria-hidden and pointer-events:none
 * so it never blocks the page underneath.
 *
 * Implementation note: the show is started in two phases — a first effect
 * mounts the overlay (setVisible), and a second effect starts the canvas
 * animation only once the overlay (and therefore the <canvas>) is actually in
 * the DOM. Doing it in one effect leaves canvasRef null and silently kills the
 * confetti/fireworks.
 *
 * @param {boolean} run       Flip to true to start the show (one-shot).
 * @param {Function} onDone   Called once the show has fully faded out.
 * @param {string}  message   Banner text.
 */
export default function ActivationCelebration({ run, onDone, message = 'DIGIDOLLAR IS NOW ACTIVE' }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const onDoneRef = useRef(onDone);
  const audioCtxRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [balloons, setBalloons] = useState([]);

  // Keep the latest onDone without restarting the show when the parent re-renders.
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  // Phase 1: mount the overlay so the canvas exists in the DOM.
  useEffect(() => {
    if (run) {
      setVisible(true);
      setFading(false);
    }
  }, [run]);

  // Phase 2: with the overlay mounted, start the actual show.
  useEffect(() => {
    if (!run || !visible) return undefined;

    const prefersReduced = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReduced(prefersReduced);

    const showSecs = DURATION / 1000;
    // Rising balloons with launch times spread across the show so there are
    // always several in the air.
    setBalloons(Array.from({ length: prefersReduced ? 0 : 60 }, (_, i) => ({
      id: i,
      left: rand(2, 95),
      color: pick(PALETTE),
      delay: rand(0, showSecs - 8),
      dur: rand(6, 11),
      size: rand(34, 66),
      sway: rand(-45, 45),
    })));

    const timers = [];
    let stopped = false;
    let cleanupCanvas = null;
    let launchSoundPlayed = false;
    const showStart = performance.now();

    // Browsers keep audio suspended until a user gesture; the first
    // pointer/key event anywhere unlocks it (overlay is click-through). The
    // engine roar starts with the show — if audio was locked at that moment,
    // fire it the instant it unlocks, any time until the rocket is gone.
    const playRoar = () => {
      if (stopped || prefersReduced || launchSoundPlayed) return;
      const elapsed = performance.now() - showStart;
      if (elapsed < ROCKET_DELAY_MS + ROCKET_FLIGHT_SECS * 1000) {
        launchSoundPlayed = true;
        playLaunchSound(audioCtxRef);
      }
    };
    const unlockAudio = () => {
      const c = ensureAudio(audioCtxRef);
      if (!c) return;
      if (c.state === 'suspended') {
        c.resume().then(playRoar).catch(() => {});
      } else {
        playRoar();
      }
    };
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    // Eagerly create the context — some browsers start it running when the
    // user has interacted with the site before (media engagement).
    ensureAudio(audioCtxRef);

    if (!prefersReduced && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      let W = 0;
      let H = 0;
      const resize = () => {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = `${W}px`;
        canvas.style.height = `${H}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      window.addEventListener('resize', resize);

      const confetti = [];
      const sparks = [];
      const rockets = [];

      const burstConfetti = (cx, cy, n) => {
        for (let i = 0; i < n; i++) {
          const a = rand(0, Math.PI * 2);
          const sp = rand(3, 13);
          confetti.push({
            x: cx, y: cy,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp - rand(2, 6),
            w: rand(6, 14), h: rand(8, 18),
            rot: rand(0, Math.PI), vrot: rand(-0.3, 0.3),
            color: pick(PALETTE), life: rand(140, 260),
          });
        }
      };

      const rainConfetti = (n) => {
        for (let i = 0; i < n; i++) {
          confetti.push({
            x: rand(0, W), y: rand(-40, -5),
            vx: rand(-1.8, 1.8), vy: rand(2, 5.5),
            w: rand(6, 14), h: rand(8, 18),
            rot: rand(0, Math.PI), vrot: rand(-0.25, 0.25),
            color: pick(PALETTE), life: rand(240, 380),
          });
        }
      };

      const launchRocket = () => {
        rockets.push({
          x: rand(W * 0.1, W * 0.9), y: H,
          vy: rand(-14, -9),
          targetY: rand(H * 0.1, H * 0.5),
          color: pick(PALETTE),
        });
      };

      const explode = (x, y, color) => {
        const n = 64;
        for (let i = 0; i < n; i++) {
          const a = (Math.PI * 2 * i) / n;
          const sp = rand(2, 7);
          sparks.push({
            x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            color, life: rand(55, 90), decay: rand(0.9, 1.5),
          });
        }
      };

      // Big opening triple burst.
      burstConfetti(W * 0.5, H * 0.32, 320);
      burstConfetti(W * 0.15, H * 0.28, 160);
      burstConfetti(W * 0.85, H * 0.28, 160);

      // Ongoing dense confetti rain, periodic mid-air bursts, and frequent
      // multi-rocket firework volleys — sustained for the whole show.
      const rainId = setInterval(() => { if (!stopped) rainConfetti(20); }, 180);
      const burstId = setInterval(() => {
        if (!stopped) burstConfetti(rand(W * 0.2, W * 0.8), rand(H * 0.2, H * 0.5), 90);
      }, 2200);
      const rocketId = setInterval(() => {
        if (stopped) return;
        const volley = 2 + Math.floor(rand(0, 3)); // 2–4 rockets per volley
        for (let i = 0; i < volley; i++) launchRocket();
      }, 380);
      timers.push(rainId, burstId, rocketId);

      // Engine roar starts the moment the show loads — rumbling on the pad,
      // lift-off at 5s, receding fade through the climb. If audio is still
      // locked (no gesture yet), unlockAudio() fires it on the first
      // click/tap/keypress instead.
      const c0 = audioCtxRef.current;
      if (c0 && c0.state === 'running') {
        launchSoundPlayed = true;
        playLaunchSound(audioCtxRef);
      }

      const draw = () => {
        ctx.clearRect(0, 0, W, H);

        for (let i = confetti.length - 1; i >= 0; i--) {
          const p = confetti[i];
          p.vy += 0.14; p.vx *= 0.995;
          p.x += p.vx; p.y += p.vy; p.rot += p.vrot; p.life -= 1;
          if (p.life <= 0 || p.y > H + 40) { confetti.splice(i, 1); continue; }
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = Math.min(1, p.life / 40);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }

        for (let i = rockets.length - 1; i >= 0; i--) {
          const r = rockets[i];
          r.y += r.vy; r.vy += 0.06;
          ctx.save();
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = r.color;
          ctx.beginPath(); ctx.arc(r.x, r.y, 2.6, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
          if (r.y <= r.targetY || r.vy >= 0) { explode(r.x, r.y, r.color); rockets.splice(i, 1); }
        }

        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.vy += 0.05; s.vx *= 0.98; s.vy *= 0.98;
          s.x += s.vx; s.y += s.vy; s.life -= s.decay;
          if (s.life <= 0) { sparks.splice(i, 1); continue; }
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, s.life / 60));
          ctx.fillStyle = s.color;
          ctx.beginPath(); ctx.arc(s.x, s.y, 2.4, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }

        rafRef.current = requestAnimationFrame(draw);
      };
      draw();

      // Stop spawning after the show; existing particles settle out naturally.
      const stopId = setTimeout(() => {
        stopped = true;
        clearInterval(rainId);
        clearInterval(burstId);
        clearInterval(rocketId);
      }, DURATION);
      timers.push(stopId);

      cleanupCanvas = () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(rafRef.current);
      };
    }

    // Fade the overlay, then unmount and notify the parent.
    const fadeId = setTimeout(() => setFading(true), DURATION);
    const doneId = setTimeout(() => {
      setVisible(false);
      setBalloons([]);
      if (typeof onDoneRef.current === 'function') onDoneRef.current();
    }, DURATION + FADE);
    timers.push(fadeId, doneId);

    return () => {
      stopped = true;
      timers.forEach((id) => { clearTimeout(id); clearInterval(id); });
      cancelAnimationFrame(rafRef.current);
      if (cleanupCanvas) cleanupCanvas();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [run, visible]);

  if (!visible) return null;

  return (
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        pointerEvents: 'none',
        overflow: 'hidden',
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE}ms ease`,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

      {balloons.map((b) => (
        <Box
          key={b.id}
          sx={{
            position: 'absolute',
            bottom: -100,
            left: `${b.left}%`,
            '--sway': `${b.sway}px`,
            animation: `dgb-balloon-rise ${b.dur}s ease-in ${b.delay}s both`,
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: b.size,
              height: b.size * 1.2,
              borderRadius: '50% 50% 48% 48% / 55% 55% 45% 45%',
              background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.9), ${b.color} 62%)`,
              boxShadow: 'inset -5px -7px 12px rgba(0,0,0,0.18)',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                bottom: -7,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: `8px solid ${b.color}`,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                width: '1px',
                height: b.size * 1.4,
                background: 'rgba(120,120,120,0.45)',
              }}
            />
          </Box>
        </Box>
      ))}

      {/* Big DGB logo rocket — sits on the pad, ignites at 5s, climbs slowly
          up through the middle of the celebration */}
      {!reduced && (
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            bottom: '3%',
            animation: `dgb-rocket-launch ${ROCKET_FLIGHT_SECS}s linear ${ROCKET_DELAY_MS / 1000}s both`,
          }}
        >
          <Box sx={{ position: 'relative', width: 170 }}>
            {/* nose cone */}
            <Box
              sx={{
                width: 0, height: 0, mx: 'auto',
                borderLeft: '50px solid transparent',
                borderRight: '50px solid transparent',
                borderBottom: '80px solid #d32f2f',
              }}
            />
            {/* body with DGB logo */}
            <Box
              sx={{
                width: 100, height: 190, mx: 'auto',
                background: 'linear-gradient(90deg, #e8eef7 0%, #ffffff 45%, #c9d6e8 100%)',
                border: '3px solid #90a4c4',
                borderRadius: '0 0 16px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Box
                component="img"
                src="/logo.png"
                alt=""
                sx={{
                  width: 76, height: 76,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 0 18px rgba(0,102,204,0.65)',
                }}
              />
            </Box>
            {/* fins */}
            <Box
              sx={{
                position: 'absolute', bottom: 106, left: 6,
                width: 0, height: 0,
                borderTop: '50px solid transparent',
                borderRight: '32px solid #d32f2f',
              }}
            />
            <Box
              sx={{
                position: 'absolute', bottom: 106, right: 6,
                width: 0, height: 0,
                borderTop: '50px solid transparent',
                borderLeft: '32px solid #d32f2f',
              }}
            />
            {/* flame */}
            <Box
              sx={{
                width: 48, height: 110, mx: 'auto', mt: '-3px',
                borderRadius: '50% 50% 50% 50% / 30% 30% 70% 70%',
                background: 'radial-gradient(circle at 50% 18%, #fff59d, #ffb300 45%, #ff5722 75%, rgba(255,87,34,0))',
                transformOrigin: 'top center',
                animation: 'dgb-flame 120ms linear infinite alternate',
              }}
            />
          </Box>
        </Box>
      )}

      {/* Big flashing centre banner */}
      <Typography
        component="div"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          textAlign: 'center',
          whiteSpace: { xs: 'normal', sm: 'nowrap' },
          maxWidth: '94vw',
          px: { xs: 3, sm: 6 },
          py: { xs: 2, sm: 3 },
          borderRadius: '18px',
          color: '#fff',
          fontWeight: 900,
          textTransform: 'uppercase',
          fontSize: { xs: '2rem', sm: '3.2rem', md: '4.2rem' },
          lineHeight: 1.05,
          letterSpacing: '1px',
          textShadow: '0 3px 18px rgba(0,0,0,0.55)',
          background: 'rgba(0,35,82,0.62)',
          boxShadow: '0 12px 44px rgba(0,0,0,0.4)',
          transform: 'translate(-50%, -50%)',
          animation: reduced
            ? 'none'
            : 'dgb-pop 500ms cubic-bezier(.18,.9,.3,1.4) both, dgb-flash 1.15s 500ms ease-in-out infinite',
        }}
      >
        🎉 {message} 🎉
      </Typography>

      <style>{`
        @keyframes dgb-balloon-rise {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { transform: translateY(-122vh) translateX(var(--sway, 0px)); opacity: 0; }
        }
        /* 2s of pad-shake, then a slow accelerating climb off the top */
        @keyframes dgb-rocket-launch {
          0%   { transform: translate(-50%, 0); }
          2%   { transform: translate(calc(-50% - 5px), 0); }
          4%   { transform: translate(calc(-50% + 5px), 0); }
          6%   { transform: translate(calc(-50% - 5px), 0); }
          8%   { transform: translate(calc(-50% + 5px), 0); }
          10%  { transform: translate(calc(-50% - 4px), 0); }
          12%  { transform: translate(calc(-50% + 4px), 0); }
          14%  { transform: translate(calc(-50% - 4px), 0); }
          16%  { transform: translate(calc(-50% + 4px), 0); }
          18%  { transform: translate(calc(-50% - 3px), 0); }
          20%  { transform: translate(-50%, -1vh); }
          35%  { transform: translate(-50%, -8vh); }
          50%  { transform: translate(-50%, -22vh); }
          65%  { transform: translate(-50%, -45vh); }
          80%  { transform: translate(-50%, -80vh); }
          100% { transform: translate(-50%, -145vh); }
        }
        @keyframes dgb-flame {
          from { transform: scaleY(0.75) scaleX(0.9); opacity: 0.85; }
          to   { transform: scaleY(1.18) scaleX(1.06); opacity: 1; }
        }
        @keyframes dgb-pop {
          0%   { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        @keyframes dgb-flash {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
            background-color: rgba(0,35,82,0.62);
            box-shadow: 0 0 0 rgba(255,213,79,0), 0 12px 44px rgba(0,0,0,0.4);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.12);
            opacity: 0.72;
            background-color: rgba(0,102,204,0.72);
            box-shadow: 0 0 44px rgba(255,213,79,0.9), 0 12px 44px rgba(0,0,0,0.4);
          }
        }
      `}</style>
    </Box>
  );
}
