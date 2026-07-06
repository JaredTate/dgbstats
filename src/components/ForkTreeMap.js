import React, { useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useWidth } from '../utils';

/**
 * ForkTreeMap — a hand-rolled, responsive, real-time SVG map of the DigiByte
 * chain tip and its competing fork branches.
 *
 * Orientation is VERTICAL (newest block at the TOP, older downward) so it reads
 * the same on desktop and mobile. The main chain is a bold central spine; each
 * competing tip diverges from the spine at its fork height and rises to the tip,
 * offset to alternating sides and coloured by status. Deeper branches render
 * thicker.
 *
 * The visible height window starts at a compact base (minN heights) and expands
 * downward to reach the deepest recent fork, up to a cap (maxReach); the row
 * spacing compresses for tall windows so the map stays a sensible height. Stale
 * tips older than the window are summarised beneath the map (they live in the
 * orphan table in full).
 *
 * Props:
 *   blocks      – recentBlocks array (newest-first) — the main-chain spine.
 *   tips        – chainTips.tips array (fork tips, each with forkHeight).
 *   activeHash  – hash of the active tip (top of spine); pulses.
 *   accentColor – network accent colour for the spine.
 */

const STATUS_COLORS = {
  active: '#4caf50',
  'valid-fork': '#ff9800',
  'valid-headers': '#ffc107',
  'headers-only': '#9e9e9e',
  invalid: '#f44336',
};

const ALGO_COLORS = {
  sha256d: '#4caf50',
  scrypt: '#2196f3',
  skein: '#ff9800',
  qubit: '#9c27b0',
  odo: '#f44336',
  odocrypt: '#f44336',
  groestl: '#795548',
  'myriad-groestl': '#795548',
};

const shortHash = (hash) => {
  if (!hash || typeof hash !== 'string') return '—';
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`;
};

const algoColor = (algo) => ALGO_COLORS[String(algo || '').toLowerCase()] || '#90a4ae';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const LEGEND_ITEMS = [
  { label: 'Active tip', color: STATUS_COLORS.active },
  { label: 'Valid fork', color: STATUS_COLORS['valid-fork'] },
  { label: 'Valid headers', color: STATUS_COLORS['valid-headers'] },
  { label: 'Headers only', color: STATUS_COLORS['headers-only'] },
  { label: 'Invalid', color: STATUS_COLORS.invalid },
];

function ForkTreeMap({ blocks = [], tips = [], activeHash = null, accentColor = '#002352' }) {
  const width = useWidth();
  const [hovered, setHovered] = useState(null);

  const isMobile = width < 600;
  const minN = isMobile ? 14 : 18;       // compact window when the chain is quiet
  const maxReach = isMobile ? 44 : 72;   // how far back a fork may pull the window
  const VBW = isMobile ? 300 : 400;
  const cx = VBW / 2;
  const topPad = 26;
  const bottomPad = 26;

  const geometry = useMemo(() => {
    const validBlocks = (blocks || []).filter((b) => b && Number.isFinite(b.height));
    const validTips = (tips || []).filter((t) => t && Number.isFinite(t.height));

    const forkOf = (t) => (Number.isFinite(t.forkHeight) ? t.forkHeight : t.height - (t.branchlen || 1));

    const heights = [...validBlocks.map((b) => b.height), ...validTips.map((t) => t.height)];
    const topHeight = heights.length ? Math.max(...heights) : 0;

    // Window base (minN heights); expand down to the deepest fork within maxReach.
    const reachFloor = topHeight - maxReach;
    const forksInReach = validTips.filter((t) => forkOf(t) >= reachFloor && forkOf(t) <= topHeight);
    let minHeight = topHeight - (minN - 1);
    for (const t of forksInReach) minHeight = Math.min(minHeight, forkOf(t));
    minHeight = Math.max(minHeight, reachFloor);

    // Spine: one main-chain block per height, newest-first, within the window.
    const seen = new Set();
    const spineBlocks = [];
    for (const b of validBlocks) {
      if (b.height < minHeight || b.height > topHeight) continue;
      if (seen.has(b.height)) continue;
      seen.add(b.height);
      spineBlocks.push(b);
    }

    const windowTips = validTips.filter((t) => {
      const fh = forkOf(t);
      return fh >= minHeight && fh <= topHeight;
    });
    const olderTips = validTips.filter((t) => forkOf(t) < minHeight);

    const rows = Math.max(1, topHeight - minHeight);
    // Compress the row spacing for tall windows so the map stays a sane height,
    // and shrink the node radius in lock-step so nodes never overlap.
    const targetHeight = isMobile ? 480 : 560;
    const rowGap = clamp(Math.floor(targetHeight / rows), 8, 26);
    const nodeR = clamp(Math.round(rowGap * 0.42), 3, isMobile ? 6 : 7);
    const branchGap = isMobile ? 34 : 52;
    const showEveryLabel = rowGap >= 17;
    const labelEvery = showEveryLabel ? 1 : Math.max(2, Math.ceil(20 / rowGap));
    const VBH = topPad + rows * rowGap + bottomPad;

    const yForHeight = (h) => topPad + (topHeight - h) * rowGap;

    const spineNodes = spineBlocks.map((b, i) => ({
      block: b,
      x: cx,
      y: yForHeight(b.height),
      active: !!activeHash && b.hash === activeHash,
      showLabel: showEveryLabel || i % labelEvery === 0 || (!!activeHash && b.hash === activeHash),
    }));

    const branches = windowTips.map((t, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      const level = Math.floor(i / 2) + 1;
      const bx = clamp(cx + side * branchGap * level, nodeR + 6, VBW - nodeR - 6);
      const fh = clamp(forkOf(t), minHeight, topHeight);
      const th = clamp(t.height, fh + 1, topHeight);
      const nodeHeights = [];
      for (let h = fh + 1; h <= th; h++) nodeHeights.push(h);
      return {
        tip: t,
        status: t.status || 'valid-fork',
        color: STATUS_COLORS[t.status] || STATUS_COLORS['valid-fork'],
        strokeWidth: clamp(2 + (t.branchlen || 1), 2, 7),
        bx,
        forkPoint: { x: cx, y: yForHeight(fh) },
        firstNode: { x: bx, y: yForHeight(Math.min(fh + 1, topHeight)) },
        nodes: nodeHeights.map((h) => ({ x: bx, y: yForHeight(h), height: h, isTip: h === th })),
      };
    });

    // Tightly fit the viewBox to the actual content (labels left of the spine +
    // spine + any branches) so a fork-free chain is a clean centred column and
    // the map only widens when branches actually appear.
    const labelW = 48;
    const tipLabelW = isMobile ? 0 : 78; // branch tip short-hash labels (desktop only)
    let minX = cx - nodeR;
    let maxX = cx + nodeR + 3;
    if (spineNodes.some((n) => n.showLabel)) minX = Math.min(minX, cx - nodeR - 8 - labelW);
    for (const br of branches) {
      if (br.bx >= cx) {
        minX = Math.min(minX, br.bx - nodeR);
        maxX = Math.max(maxX, br.bx + nodeR + tipLabelW);
      } else {
        minX = Math.min(minX, br.bx - nodeR - tipLabelW);
        maxX = Math.max(maxX, br.bx + nodeR);
      }
    }
    const pad = 12;
    const vbX = minX - pad;
    const vbW = maxX - minX + 2 * pad;

    return { VBH, VBW, vbX, vbW, topHeight, minHeight, rows, spineNodes, branches, olderTips, yForHeight, nodeR, hasData: validBlocks.length > 0 };
  }, [blocks, tips, activeHash, minN, maxReach, VBW, cx, isMobile]);

  const { VBH, vbX, vbW, spineNodes, branches, olderTips, yForHeight, nodeR, hasData } = geometry;

  const showSpineTooltip = (node) =>
    setHovered({
      height: node.block.height,
      hash: node.block.hash,
      status: node.active ? 'active tip' : 'main chain',
      algo: node.block.algo,
      pool: node.block.poolIdentifier || node.block.pool,
    });

  const showBranchTooltip = (branch, node) =>
    setHovered({
      height: node.height,
      hash: branch.tip.hash,
      status: branch.status,
      algo: branch.tip.algo,
      pool: branch.tip.pool,
    });

  const clearTooltip = () => setHovered(null);

  return (
    <Box
      data-testid="fork-tree-map"
      sx={{ position: 'relative', width: '100%', maxWidth: 460, mx: 'auto', overflow: 'hidden' }}
    >
      <style>{`
        @keyframes ftm-pulse {
          0%   { opacity: 0.9; transform: scale(1); }
          50%  { opacity: 0.3; transform: scale(1.7); }
          100% { opacity: 0.9; transform: scale(1); }
        }
        @keyframes ftm-fade { from { opacity: 0; } to { opacity: 1; } }
        .ftm-active-halo { animation: ftm-pulse 1.8s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        .ftm-node { animation: ftm-fade 0.5s ease-out both; }
        .ftm-branch { animation: ftm-fade 0.6s ease-out both; }
        .ftm-shadow { filter: drop-shadow(0 1px 1.5px rgba(0,35,82,0.35)); }
        @media (prefers-reduced-motion: reduce) {
          .ftm-active-halo, .ftm-node, .ftm-branch { animation: none; }
        }
      `}</style>

      {!hasData ? (
        <Box sx={{ py: 3, textAlign: 'center', color: '#90a4ae' }}>
          <Typography variant="body2">Waiting for live chain data…</Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <svg
              viewBox={`${vbX} 0 ${vbW} ${VBH}`}
              width="100%"
              height={VBH}
              preserveAspectRatio="xMidYMin meet"
              style={{ display: 'block', maxWidth: Math.max(vbW, 150), margin: '0 auto' }}
              role="img"
              aria-label="Live chain tips and fork branches map"
            >
              <defs>
                <linearGradient id="ftm-spine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity="0.95" />
                  <stop offset="100%" stopColor={accentColor} stopOpacity="0.35" />
                </linearGradient>
              </defs>

              {/* Main-chain spine */}
              {spineNodes.length > 0 && (
                <line
                  x1={cx}
                  y1={yForHeight(geometry.topHeight)}
                  x2={cx}
                  y2={yForHeight(geometry.minHeight)}
                  stroke="url(#ftm-spine)"
                  strokeWidth={5}
                  strokeLinecap="round"
                />
              )}

              {/* Fork branches (drawn under the spine nodes) */}
              {branches.map((branch, i) => (
                <g key={`branch-${i}`} className="ftm-branch" data-testid="fork-branch" data-status={branch.status}>
                  {/* curved connector from the spine fork point to the first branch node */}
                  <path
                    d={`M ${branch.forkPoint.x} ${branch.forkPoint.y} Q ${branch.bx} ${branch.forkPoint.y} ${branch.firstNode.x} ${branch.firstNode.y}`}
                    fill="none"
                    stroke={branch.color}
                    strokeWidth={branch.strokeWidth}
                    strokeLinecap="round"
                    opacity={0.9}
                  />
                  {branch.nodes.length > 1 && (
                    <line
                      x1={branch.bx}
                      y1={branch.firstNode.y}
                      x2={branch.bx}
                      y2={branch.nodes[branch.nodes.length - 1].y}
                      stroke={branch.color}
                      strokeWidth={branch.strokeWidth}
                      strokeLinecap="round"
                      opacity={0.9}
                    />
                  )}
                  {/* fork-point marker on the spine */}
                  <circle cx={branch.forkPoint.x} cy={branch.forkPoint.y} r={3.2} fill="#ffffff" stroke={branch.color} strokeWidth={2} />
                  {branch.nodes.map((node, j) => (
                    <circle
                      key={`bn-${i}-${j}`}
                      data-testid="branch-node"
                      data-height={node.height}
                      className="ftm-shadow"
                      cx={node.x}
                      cy={node.y}
                      r={node.isTip ? nodeR : nodeR - 2}
                      fill={branch.color}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      style={{ cursor: 'pointer' }}
                      onMouseOver={() => showBranchTooltip(branch, node)}
                      onMouseOut={clearTooltip}
                      onClick={() => showBranchTooltip(branch, node)}
                    />
                  ))}
                  {/* short-hash label at the branch tip */}
                  {!isMobile && branch.nodes.length > 0 && (
                    <text
                      data-testid="branch-tip-label"
                      x={branch.bx + (branch.bx >= cx ? nodeR + 6 : -(nodeR + 6))}
                      y={branch.nodes[branch.nodes.length - 1].y + 3}
                      fontSize="8.5"
                      fill={branch.color}
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor={branch.bx >= cx ? 'start' : 'end'}
                    >
                      {shortHash(branch.tip.hash)}
                    </text>
                  )}
                </g>
              ))}

              {/* Main-chain nodes */}
              {spineNodes.map((node, i) => (
                <g
                  key={`spine-${node.block.hash || i}`}
                  className="ftm-node"
                  data-testid="spine-node"
                  data-height={node.block.height}
                  data-active={node.active ? 'true' : 'false'}
                  style={{ cursor: 'pointer' }}
                  onMouseOver={() => showSpineTooltip(node)}
                  onMouseOut={clearTooltip}
                  onClick={() => showSpineTooltip(node)}
                >
                  {node.active && (
                    <circle className="ftm-active-halo" cx={node.x} cy={node.y} r={nodeR + 4} fill={STATUS_COLORS.active} />
                  )}
                  <circle
                    className="ftm-shadow"
                    cx={node.x}
                    cy={node.y}
                    r={nodeR + 1}
                    fill={node.active ? STATUS_COLORS.active : accentColor}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                  <circle cx={node.x} cy={node.y} r={2.5} fill={algoColor(node.block.algo)} />
                  {node.showLabel && (
                    <text
                      x={node.x - nodeR - 8}
                      y={node.y + 3}
                      fontSize="9"
                      fill="#607d8b"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {node.block.height}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </Box>

          {hovered && (
            <Box
              data-testid="fork-tooltip"
              sx={{
                position: 'absolute',
                top: 6,
                left: 6,
                bgcolor: 'rgba(0,0,0,0.82)',
                color: '#fff',
                px: 1.25,
                py: 0.75,
                borderRadius: 1,
                fontSize: '0.72rem',
                lineHeight: 1.5,
                pointerEvents: 'none',
                maxWidth: '70%',
                zIndex: 2,
              }}
            >
              <Box sx={{ fontWeight: 'bold' }}>Height {hovered.height}</Box>
              <Box sx={{ fontFamily: 'monospace' }}>{shortHash(hovered.hash)}</Box>
              <Box>Status: {hovered.status}</Box>
              {hovered.algo && <Box>Algo: {hovered.algo}</Box>}
              {hovered.pool && <Box>Pool: {hovered.pool}</Box>}
            </Box>
          )}
        </>
      )}

      {/* Older stale tips beyond the visible window (full detail in the table below) */}
      {hasData && olderTips.length > 0 && (
        <Typography
          data-testid="fork-older-note"
          variant="caption"
          component="p"
          sx={{ textAlign: 'center', color: '#90a4ae', mt: 0.5 }}
        >
          + {olderTips.length} older stale tip{olderTips.length > 1 ? 's' : ''} beyond this window — see the orphan table below
        </Typography>
      )}

      {/* Legend — translucent pill chips */}
      <Box
        data-testid="fork-legend"
        sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, justifyContent: 'center', mt: 1.5, px: 1 }}
      >
        {LEGEND_ITEMS.map((item) => (
          <Box
            key={item.label}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.6,
              px: 1.1,
              py: 0.35,
              borderRadius: '999px',
              bgcolor: `${item.color}14`,
              border: `1px solid ${item.color}45`,
            }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: '#4a5a6d', fontWeight: 600, fontSize: '0.68rem' }}>
              {item.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default React.memo(ForkTreeMap);
