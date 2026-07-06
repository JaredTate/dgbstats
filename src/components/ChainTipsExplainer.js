import React from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Divider,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import SpeedIcon from '@mui/icons-material/Speed';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

/**
 * ChainTipsExplainer — a collapsible, mobile-friendly educational section that
 * teaches what the /tips "Chain Tips & Orphans" page is showing: chain tips,
 * orphan / stale blocks, why DigiByte produces a healthy trickle of them, the
 * getchaintips statuses, branch length / reorgs, and when a fork is a real risk.
 *
 * It is purely presentational (no network, no WebSocket). The status chips use
 * the exact STATUS_COLORS from ForkTreeMap / ChainTipsPage so the legend here
 * matches the live fork-tree map above it.
 *
 * Props:
 *   accentColor – network accent colour for the card border and headings.
 */

// Kept byte-for-byte in sync with ForkTreeMap.js and ChainTipsPage.js so the
// chips below colour-match the live map's nodes and legend.
const STATUS_COLORS = {
  active: '#4caf50',
  'valid-fork': '#ff9800',
  'valid-headers': '#ffc107',
  'headers-only': '#9e9e9e',
  invalid: '#f44336',
};

// getchaintips status legend (label + plain-language meaning).
const STATUS_ITEMS = [
  { status: 'active', desc: 'On the main chain — the best (most cumulative work) chain this node follows.' },
  { status: 'valid-fork', desc: 'A fully-validated competing block off the main chain — a stale / orphan block.' },
  { status: 'valid-headers', desc: 'The block has been seen and its header checked, but the full block was not validated.' },
  { status: 'headers-only', desc: 'Only the block header is known; the full block has not been downloaded yet.' },
  { status: 'invalid', desc: 'Violates consensus rules and was rejected. This is the status to watch.' },
];

const StatusChip = ({ status }) => (
  <Chip
    label={status}
    size="small"
    sx={{
      backgroundColor: STATUS_COLORS[status],
      color: '#fff',
      fontWeight: 'bold',
      fontFamily: 'monospace',
    }}
  />
);

const ChainTipsExplainer = ({ accentColor = '#0066cc' }) => {
  // Each topic renders as its own collapsible Accordion. The first is open by
  // default so the section teaches at a glance without dominating the page.
  const topics = [
    {
      icon: <AccountTreeIcon sx={{ color: accentColor }} />,
      title: 'What is a chain tip?',
      body: (
        <>
          <Typography variant="body2" sx={{ mb: 1.5, color: '#444', lineHeight: 1.7 }}>
            A <strong>chain tip</strong> is the newest block of any chain branch a node knows about.
            Every node tracks the <strong>active (best) chain</strong> — the branch with the most
            accumulated proof-of-work — plus <em>every</em> competing branch tip it has ever seen.
          </Typography>
          <Typography variant="body2" sx={{ color: '#444', lineHeight: 1.7 }}>
            The <code>getchaintips</code> RPC lists them all: the one active tip you would call
            "the blockchain," alongside the stray tips of shorter, competing branches. This page maps
            those tips live so you can see the whole picture, not just the winning chain.
          </Typography>
        </>
      ),
    },
    {
      icon: <CallSplitIcon sx={{ color: STATUS_COLORS['valid-fork'] }} />,
      title: 'What is an orphan / stale block?',
      body: (
        <>
          <Typography variant="body2" sx={{ mb: 1.5, color: '#444', lineHeight: 1.7 }}>
            An orphan / stale block is a <strong>fully-valid block that isn't on the main chain</strong>{' '}
            because another block at the same height won the race. It broke no rules — it simply arrived
            a moment too late (or with slightly less work behind it) and the network built on the other
            block instead.
          </Typography>
          <Typography variant="body2" sx={{ color: '#444', lineHeight: 1.7 }}>
            The precise term matters: in Bitcoin-family chains these are usually called{' '}
            <strong>"stale" blocks</strong>. True <em>"orphans"</em> — genuinely parentless blocks —
            effectively don't exist anymore now that nodes sync headers first. A stale block is{' '}
            <strong>real mining work that didn't make the canonical chain</strong>, not an error or an attack.
          </Typography>
        </>
      ),
    },
    {
      icon: <SpeedIcon sx={{ color: accentColor }} />,
      title: 'Why does DigiByte produce them?',
      body: (
        <>
          <Typography variant="body2" sx={{ mb: 1.5, color: '#444', lineHeight: 1.7 }}>
            DigiByte targets a <strong>15-second block time</strong> across{' '}
            <strong>5 independent mining algorithms</strong> — SHA256D, Scrypt, Skein, Qubit and
            Odocrypt. Fast blocks plus many miners on different algos mean two perfectly valid blocks
            are frequently found at nearly the same instant.
          </Typography>
          <Typography variant="body2" sx={{ color: '#444', lineHeight: 1.7 }}>
            When that happens, one block becomes the tip and the other goes stale. So a steady trickle
            of <strong>single-block stales is healthy and expected</strong> on DigiByte — it is the
            normal cost of very fast, multi-algorithm blocks, not a fork or a sign of trouble.
          </Typography>
        </>
      ),
    },
    {
      icon: <HelpOutlineIcon sx={{ color: accentColor }} />,
      title: 'Tip statuses',
      body: (
        <>
          <Typography variant="body2" sx={{ mb: 2, color: '#444', lineHeight: 1.7 }}>
            Every tip <code>getchaintips</code> returns carries a status. These chips use the exact
            same colours as the live fork-tree map above:
          </Typography>
          <Box
            data-testid="status-legend"
            sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
          >
            {STATUS_ITEMS.map((item) => (
              <Box
                key={item.status}
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 0.5, sm: 1.5 },
                }}
              >
                <Box sx={{ flexShrink: 0, minWidth: { sm: 120 } }}>
                  <StatusChip status={item.status} />
                </Box>
                <Typography variant="body2" sx={{ color: '#444', lineHeight: 1.6 }}>
                  {item.desc}
                </Typography>
              </Box>
            ))}
          </Box>
        </>
      ),
    },
    {
      icon: <SyncAltIcon sx={{ color: accentColor }} />,
      title: 'Branch length & reorganizations (reorgs)',
      body: (
        <>
          <Typography variant="body2" sx={{ mb: 1.5, color: '#444', lineHeight: 1.7 }}>
            <strong>Branch length</strong> is how many blocks a competing chain has that aren't on the
            main chain. A branch length of <strong>1 is a lone stale</strong> — completely normal.
            Longer branches mean a competitor is being actively extended.
          </Typography>
          <Typography variant="body2" sx={{ color: '#444', lineHeight: 1.7 }}>
            A <strong>reorganization (reorg)</strong> happens when the node switches to a longer
            competing chain, replacing one or more recent blocks with the competitor's. Shallow reorgs
            are routine; <strong>deeper reorgs can affect transaction finality</strong>, because a
            transaction that looked confirmed can briefly return to unconfirmed while the chain re-settles.
          </Typography>
        </>
      ),
    },
    {
      icon: <WarningAmberIcon sx={{ color: STATUS_COLORS.invalid }} />,
      title: 'When is it a real fork risk?',
      body: (
        <>
          <Typography variant="body2" sx={{ mb: 1.5, color: '#444', lineHeight: 1.7 }}>
            Single-block stales are routine and healthy. The risk rises when a competing branch:
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0, mb: 1.5, color: '#444' }}>
            <Typography component="li" variant="body2" sx={{ mb: 0.75, lineHeight: 1.6 }}>
              is <strong>4 or more blocks deep</strong>, not just a single lone stale;
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.75, lineHeight: 1.6 }}>
              <strong>keeps growing across time</strong> — a sign it is being actively mined, not abandoned;
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.75, lineHeight: 1.6 }}>
              is flagged <strong>invalid</strong> (breaks consensus rules); or
            </Typography>
            <Typography component="li" variant="body2" sx={{ lineHeight: 1.6 }}>
              triggers a <strong>deep reorg</strong> that rewrites several confirmed blocks.
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#444', lineHeight: 1.7 }}>
            Those are exactly the conditions that turn this page's status banner{' '}
            <Box component="span" sx={{ color: '#e65100', fontWeight: 700 }}>amber</Box> or{' '}
            <Box component="span" sx={{ color: '#c62828', fontWeight: 700 }}>red</Box>. Until then, a
            calm feed of lone single-block stales is simply DigiByte working as designed.
          </Typography>
        </>
      ),
    },
  ];

  return (
    <Card
      data-testid="chain-tips-explainer"
      elevation={3}
      sx={{
        borderRadius: '12px',
        borderTop: `4px solid ${accentColor}`,
        mb: 4,
      }}
    >
      <CardContent sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <MenuBookIcon sx={{ color: accentColor, fontSize: '1.8rem' }} />
          <Typography
            variant="h5"
            component="h2"
            fontWeight="bold"
            sx={{ color: accentColor, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
          >
            Understanding Chain Tips & Orphans
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#666', mb: 2, lineHeight: 1.6 }}>
          New to what you're seeing above? These short, plain-language sections explain chain tips,
          stale blocks, and when a competing branch is worth worrying about. Tap any heading to expand it.
        </Typography>
        <Divider sx={{ mb: 2, borderColor: `${accentColor}33` }} />

        {topics.map((topic, index) => (
          <Accordion
            key={topic.title}
            defaultExpanded={index === 0}
            disableGutters
            elevation={0}
            TransitionProps={{ unmountOnExit: true }}
            sx={{
              border: '1px solid #eee',
              borderRadius: '8px !important',
              mb: 1.5,
              overflow: 'hidden',
              '&:before': { display: 'none' },
              '&.Mui-expanded': { margin: '0 0 12px 0' },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`topic-content-${index}`}
              id={`topic-header-${index}`}
              sx={{
                backgroundColor: `${accentColor}0a`,
                '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1.25, my: 1 },
              }}
            >
              <Box sx={{ display: 'flex', flexShrink: 0 }}>{topic.icon}</Box>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ color: '#222', fontSize: { xs: '0.95rem', sm: '1.05rem' } }}
              >
                {topic.title}
              </Typography>
            </AccordionSummary>
            <AccordionDetails
              data-testid={`topic-body-${index}`}
              sx={{ backgroundColor: '#fff', px: { xs: 2, sm: 3 }, py: 2 }}
            >
              {topic.body}
            </AccordionDetails>
          </Accordion>
        ))}
      </CardContent>
    </Card>
  );
};

export default React.memo(ChainTipsExplainer);
