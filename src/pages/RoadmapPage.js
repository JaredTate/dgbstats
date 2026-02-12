import React, { useState, useEffect, useMemo } from 'react';
import { 
  Container, Typography, Box, Grid, Card, CardContent, 
  Chip, LinearProgress, IconButton, Tooltip, Collapse,
  useMediaQuery, useTheme, Paper, Divider, Stack
} from '@mui/material';
import { 
  Timeline, TimelineItem, TimelineSeparator, TimelineConnector, 
  TimelineContent, TimelineDot, TimelineOppositeContent 
} from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import UpdateIcon from '@mui/icons-material/Update';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TokenIcon from '@mui/icons-material/Token';
import SpeedIcon from '@mui/icons-material/Speed';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { format } from 'date-fns';
import config from '../config';
import { keyframes } from '@mui/material';

// Define pulse animation
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 152, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0);
  }
`;

/**
 * RoadmapPage Component - DigiByte Core Development Roadmap
 * 
 * Displays the core development roadmap for the next three years including:
 * - DigiByte v8.26 upgrade (Bitcoin v26.2 merge)
 * - DigiDollar blueprint and development phases
 * - DigiDollar v9.26 hard fork release
 * - Post-DigiDollar activation use cases
 */
const RoadmapPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expandedPhases, setExpandedPhases] = useState({});
  const [roadmapData, setRoadmapData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Roadmap data structure for the next three years
  const initialRoadmapData = {
    lastUpdated: new Date().toISOString(),
    overallProgress: 55, // Updated Feb 2026 - Phase 1-3 complete, Phase 4 in progress
    phases: [
      {
        id: 'phase1',
        title: 'DigiByte v8.26 Taproot Release',
        subtitle: 'Bitcoin v26.2 Merge',
        timeRange: 'June - October 2025',
        startDate: '2025-08-01',
        endDate: '2025-10-31',
        status: 'completed',
        progress: 100,
        icon: <UpdateIcon />,
        color: '#ff9800',
        description: 'Merging Bitcoin Core v26.2 into DigiByte v8.22.2 to create DigiByte v8.26 with Taproot support and enhanced features.',
        keyFeatures: [
          '🔄 Bitcoin v26.2 merge into DigiByte v8.22.2',
          '✅ Complete all testing phases',
          '🚀 Enhanced performance and security',
          '📦 October 2025 release target'
        ],
        milestones: [
          {
            id: 'initial-merge',
            title: 'Complete Initial Merge',
            date: '2025-08-01',
            status: 'completed',
            description: 'Bitcoin v26.2 successfully merged into DigiByte v8.22.2'
          },
          {
            id: 'cpp-unit-tests',
            title: 'Fix All C++ Unit Tests',
            date: '2025-08-15',
            status: 'completed',
            description: 'All C++ unit tests passing successfully'
          },
          {
            id: 'functional-tests',
            title: 'Fix All Functional Tests',
            date: '2025-08-25',
            status: 'completed',
            description: 'Completion of all functional tests',
            completionDate: '2025-08-31'
          },
          {
            id: 'confirm-feebug-fix',
            title: 'Confirm Feebug Fix',
            date: '2025-09-01',
            status: 'completed',
            description: 'Verify and confirm the fee calculation bug has been resolved',
            completionDate: '2025-08-31'
          },
          {
            id: 'test-mining',
            title: 'Test Multi-Algo Mining',
            date: '2025-09-05',
            status: 'completed',
            description: 'Complete multi-algorithm test mining across all 5 algorithms',
            completionDate: '2025-09-30'
          },
          {
            id: 'test-taproot',
            title: 'Test Taproot Transactions',
            date: '2025-09-10',
            status: 'completed',
            description: 'Test and verify Taproot transaction functionality',
            completionDate: '2025-08-31'
          },
          {
            id: 'test-wallet-imports',
            title: 'Test Legacy Wallet Imports',
            date: '2025-09-15',
            status: 'completed',
            description: 'Test legacy wallet import functionality and compatibility',
            completionDate: '2025-08-31'
          },
          {
            id: 'v8.26-release',
            title: 'Release Initial v8.26',
            date: '2025-10-31',
            status: 'completed',
            description: 'First official release of DigiByte v8.26',
            completionDate: '2025-09-01'
          }
        ]
      },
      {
        id: 'phase2',
        title: 'DigiDollar Implementation Specs',
        subtitle: 'Initial Design Phase',
        timeRange: 'June - November 2025',
        startDate: '2025-06-01',
        endDate: '2025-11-30',
        status: 'completed',
        progress: 100,
        icon: <AccountBalanceIcon />,
        color: '#ff9800',
        description: 'Creating the complete technical implementation specifications for DigiDollar, a decentralized stablecoin leveraging Taproot on the DigiByte blockchain.',
        keyFeatures: [
          '📋 Complete technical specification',
          '🎯 OP_DIGIDOLLAR opcode design',
          '💡 Oracle architecture planning',
          '📊 Collateralization model'
        ],
        milestones: [
          {
            id: 'dd-whitepaper',
            title: 'DigiDollar White Paper Release',
            date: '2025-06-01',
            status: 'completed',
            description: 'Release initial DigiDollar white paper outlining the concept'
          },
          {
            id: 'dd-technical-blueprint',
            title: 'DigiDollar Technical Blueprint Released',
            date: '2025-07-01',
            status: 'completed',
            description: 'Release technical blueprint with implementation details'
          },
          {
            id: 'p2tr-contract-design',
            title: 'P2TR Contract Structure Design',
            date: '2025-10-15',
            status: 'completed',
            description: 'Design Pay-to-Taproot contract structure for DigiDollar minting/redemption',
            completionDate: '2025-10-15'
          },
          {
            id: 'define-collateral-ratios',
            title: 'Define Collateral Ratio System',
            date: '2025-10-05',
            status: 'completed',
            description: 'Define sliding collateral ratios (400% at 1 month to 100% at 10 years)',
            completionDate: '2025-10-05'
          },
          {
            id: 'digidollar-opcodes-spec',
            title: 'DigiDollar Opcodes Specification',
            date: '2025-10-08',
            status: 'completed',
            description: 'Define new opcodes: OP_CHECKDOLLAR, OP_BURNDOLLAR, OP_MINTDOLLAR',
            completionDate: '2025-10-08'
          },
          {
            id: 'design-oracle-infrastructure',
            title: 'Oracle Network Architecture',
            date: '2025-10-12',
            status: 'completed',
            description: 'Design 15-oracle system with 8-of-15 Schnorr threshold signatures',
            completionDate: '2025-10-12'
          },
          {
            id: 'oracle-price-feed-spec',
            title: 'Oracle Price Feed Specification',
            date: '2025-10-15',
            status: 'completed',
            description: 'Define oracle price aggregation, update frequency, and failsafe mechanisms',
            completionDate: '2025-10-15'
          },
          {
            id: 'mast-redemption-design',
            title: 'MAST Redemption Tree Design',
            date: '2025-10-18',
            status: 'completed',
            description: 'Design Merkle tree structure for multiple redemption paths and conditions',
            completionDate: '2025-10-18'
          },
          {
            id: 'security-analysis',
            title: 'Security Analysis & Threat Modeling',
            date: '2025-10-22',
            status: 'completed',
            description: 'Comprehensive security analysis of DigiDollar attack vectors',
            completionDate: '2025-10-22'
          },
          {
            id: 'economic-model-validation',
            title: 'Economic Model Validation',
            date: '2025-10-25',
            status: 'completed',
            description: 'Validate DigiDollar economics with simulations and stress tests',
            completionDate: '2025-10-25'
          },
          {
            id: 'taproot-integration-spec',
            title: 'Taproot Integration Requirements',
            date: '2025-10-28',
            status: 'completed',
            description: 'Document all Taproot features required for DigiDollar functionality',
            completionDate: '2025-10-28'
          },
          {
            id: 'finalize-technical-spec',
            title: 'Finalize Technical Specification',
            date: '2025-11-30',
            status: 'completed',
            description: 'Complete DigiDollar Implementation Specification for development',
            completionDate: '2025-11-30'
          }
        ]
      },
      {
        id: 'phase3',
        title: 'DigiByte v9.26 DigiDollar Release',
        subtitle: 'Development & Implementation',
        timeRange: 'October 2025 - February 2026',
        startDate: '2025-10-01',
        endDate: '2026-02-28',
        status: 'completed',
        progress: 100,
        icon: <TokenIcon />,
        color: '#4caf50',
        description: 'Implementation of DigiDollar v9.26 with new opcodes, oracle system, and Taproot-based stablecoin functionality. DigiDollar is now active on testnet with 1,850+ tests passing (311 functional + 1,539 C++ unit tests).',
        keyFeatures: [
          '💻 OP_DIGIDOLLAR implementation',
          '🔧 Oracle network (Phase Two - 5-of-8 consensus)',
          '🧪 MAST & Taproot integration',
          '🔐 Consensus rule updates'
        ],
        milestones: [
          {
            id: 'op-digidollar-implementation',
            title: 'OP_DIGIDOLLAR (0xbb) Implementation',
            date: '2025-11-01',
            status: 'completed',
            description: 'Implement core OP_DIGIDOLLAR opcode for marking DigiDollar outputs',
            completionDate: '2025-11-01'
          },
          {
            id: 'collateral-time-lock',
            title: 'Time-Locked Collateral Mechanism',
            date: '2025-11-05',
            status: 'completed',
            description: 'Implement 10-tier sliding collateral ratios: 500% (30 days) to 200% (10 years)',
            completionDate: '2025-11-05'
          },
          {
            id: 'redemption-mechanism',
            title: 'Redemption Mechanism',
            date: '2025-11-10',
            status: 'completed',
            description: 'P2TR output creation, Schnorr signatures, OP_CHECKSIGADD implementation',
            completionDate: '2025-11-10'
          },
          {
            id: 'oracle-price-feeds',
            title: 'Oracle Price Feed Implementation',
            date: '2025-12-01',
            status: 'completed',
            description: '7 exchange APIs (Binance, KuCoin, Gate.io, HTX, Crypto.com, CoinGecko, CoinMarketCap) with Phase Two 5-of-8 consensus',
            completionDate: '2026-01-15'
          },
          {
            id: 'mast-implementation',
            title: 'MAST Implementation',
            date: '2025-12-15',
            status: 'completed',
            description: 'Merkle tree with 2 redemption paths (Normal + ERR) using CLTV timelocks',
            completionDate: '2025-12-20'
          },
          {
            id: 'advanced-features',
            title: 'Advanced Features',
            date: '2026-01-01',
            status: 'completed',
            description: 'Key path optimization, PSBT support, batch verification, DCA/ERR/Volatility protection',
            completionDate: '2026-01-20'
          },
          {
            id: 'wallet-enhancement',
            title: 'Wallet Enhancement',
            date: '2026-01-15',
            status: 'completed',
            description: 'GUI integration (7 tabs), privacy indicators, DigiDollar transaction support',
            completionDate: '2025-11-04'
          },
          {
            id: 'consensus-validation-rules',
            title: 'Consensus Validation Rules',
            date: '2026-02-15',
            status: 'completed',
            description: 'New transaction validation rules for DigiDollar (MINT, TRANSFER, REDEEM)',
            completionDate: '2026-01-30'
          },
          {
            id: 'digidollar-testnet',
            title: 'DigiDollar Testnet Activation',
            date: '2026-02-20',
            status: 'completed',
            description: 'DigiDollar fully functional on testnet with oracle price feeds and 5-of-8 consensus',
            completionDate: '2026-02-01'
          },
          {
            id: 'initial-release',
            title: 'Testnet Release v9.26.0-RC18',
            date: '2026-02-28',
            status: 'completed',
            description: 'Latest testnet release candidate with DigiDollar functionality, 1,850+ tests passing',
            completionDate: '2026-02-12'
          }
        ]
      },
      {
        id: 'phase4',
        title: 'DigiByte v9.26 Mainnet Release & Activation',
        subtitle: 'May 1, 2026 - Mainnet Launch',
        timeRange: 'March 2026 - May 2028',
        startDate: '2026-03-01',
        endDate: '2028-05-01',
        status: 'in-progress',
        progress: 15,
        icon: <SpeedIcon />,
        color: '#ff9800',
        description: 'DigiByte v9.26 mainnet release on May 1, 2026. Miners can begin signaling for DigiDollar activation starting May 1st. Activation window: May 1, 2026 through May 1, 2028. This is the world\'s first truly decentralized stablecoin on a UTXO blockchain.',
        keyFeatures: [
          '🚀 v9.26 mainnet release: May 1, 2026',
          '⛏️ Miner signaling begins May 1, 2026',
          '🗳️ 75% miner threshold required',
          '📅 Activation window: May 1, 2026 → May 1, 2028'
        ],
        milestones: [
          {
            id: 'v9.26-rc1',
            title: 'DigiByte v9.26 Release Candidate 1',
            date: '2025-12-01',
            status: 'completed',
            description: 'First release candidate with OP_DIGIDOLLAR and consensus changes',
            completionDate: '2025-12-01'
          },
          {
            id: 'v9.26-rc2',
            title: 'DigiByte v9.26 Release Candidate 18 (Current)',
            date: '2026-02-12',
            status: 'completed',
            description: 'Latest testnet release candidate (v9.26.0-RC18) with all DigiDollar features',
            completionDate: '2026-02-12'
          },
          {
            id: 'oracle-phase2-testnet',
            title: '8-of-15 Oracle Testnet Validation',
            date: '2026-03-15',
            status: 'pending',
            description: 'Complete 8-of-15 oracle consensus validation on testnet (currently 5-of-8)'
          },
          {
            id: 'security-pen-testing',
            title: 'Security & Penetration Testing',
            date: '2026-03-30',
            status: 'pending',
            description: 'Comprehensive security audit and penetration testing of DigiDollar consensus rules'
          },
          {
            id: 'mining-pool-coordination',
            title: 'Mining Pool & Exchange Outreach',
            date: '2026-03-15',
            status: 'in-progress',
            description: 'Coordinate with mining pools, wallets, and exchanges for v9.26 upgrade'
          },
          {
            id: 'node-upgrade-campaign',
            title: 'Node Upgrade Campaign',
            date: '2026-04-15',
            status: 'pending',
            description: 'Community outreach for node operators to upgrade to v9.26'
          },
          {
            id: 'bip9-parameters',
            title: 'BIP9 Activation Parameters',
            date: '2026-04-20',
            status: 'pending',
            description: 'Set soft fork activation parameters: start May 1, 2026, timeout May 1, 2028'
          },
          {
            id: 'v9.26-final-release',
            title: '🚀 DigiByte v9.26 Mainnet Release',
            date: '2026-05-01',
            status: 'pending',
            description: 'Official mainnet release with DigiDollar - miners can start signaling for activation'
          },
          {
            id: 'signaling-period-start',
            title: '⛏️ Miner Signaling Period Begins',
            date: '2026-05-01',
            status: 'pending',
            description: 'BIP9 signaling begins - miners vote on DigiDollar activation'
          },
          {
            id: 'signaling-threshold',
            title: '75% Signaling Threshold',
            date: '2026-06-01',
            status: 'pending',
            description: 'Monitor for 75% miner support across signaling periods'
          },
          {
            id: 'soft-fork-lock-in',
            title: 'Soft Fork Lock-In',
            date: '2026-07-01',
            status: 'pending',
            description: 'Soft fork locks in after meeting 75% activation threshold'
          },
          {
            id: 'digidollar-activation',
            title: '✅ DigiDollar Mainnet Activation',
            date: '2026-08-01',
            status: 'pending',
            description: 'DigiDollar consensus rules activate on mainnet - first decentralized stablecoin on UTXO blockchain goes live'
          },
          {
            id: 'activation-window-end',
            title: 'Activation Window Closes',
            date: '2028-05-01',
            status: 'pending',
            description: 'End of BIP9 activation window (May 1, 2026 → May 1, 2028)'
          }
        ]
      },
      {
        id: 'phase5',
        title: 'Post-DigiDollar Activation',
        subtitle: 'Use Cases & Adoption',
        timeRange: 'Q3 2026 - Mid 2027',
        startDate: '2026-07-01',
        endDate: '2027-06-30',
        status: 'pending',
        progress: 0,
        icon: <UpdateIcon />,
        color: '#666666',
        description: 'Implementation of post-DigiDollar activation use cases and ecosystem development.',
        keyFeatures: [
          '🏪 Exchange integrations',
          '💳 Payment solutions',
          '🔄 DeFi applications',
          '📈 Ecosystem growth'
        ],
        milestones: [
          {
            id: 'soft-fork-activation',
            title: 'Successful DigiDollar Soft Fork Activation',
            date: '2026-07-01',
            status: 'pending',
            description: 'DigiDollar soft fork successfully activated on mainnet'
          },
          {
            id: 'first-digidollars-minted',
            title: 'First DigiDollars Minted',
            date: '2026-08-15',
            status: 'pending',
            description: 'First DigiDollars created and minted in individual wallets'
          },
          {
            id: 'first-dex-integration',
            title: 'First DEX Integration',
            date: '2026-09-30',
            status: 'pending',
            description: 'First decentralized exchange integration for DigiDollar trading'
          },
          {
            id: 'first-merchant-adoption',
            title: 'First Merchant Adoption',
            date: '2026-10-31',
            status: 'pending',
            description: 'First major merchant accepts DigiDollar for goods/services'
          },
          {
            id: 'first-exchange-listings',
            title: 'First Exchange Listings',
            date: '2026-11-30',
            status: 'pending',
            description: 'First centralized exchange listings for DigiDollar'
          },
          {
            id: 'one-million-minted',
            title: '$1 Million DigiDollars Minted',
            date: '2026-12-31',
            status: 'pending',
            description: 'Total DigiDollar supply reaches $1 million milestone'
          },
          {
            id: 'first-payment-app',
            title: 'First Payment App Integration',
            date: '2027-01-31',
            status: 'pending',
            description: 'First payment application integrates DigiDollar payments'
          },
          {
            id: 'first-mobile-app',
            title: 'First Mobile App Integration',
            date: '2027-02-28',
            status: 'pending',
            description: 'First mobile wallet app integrates DigiDollar support'
          },
          {
            id: 'first-onchain-redemptions',
            title: 'First On-Chain Redemptions',
            date: '2027-03-31',
            status: 'pending',
            description: 'First successful on-chain DigiDollar redemptions processed'
          },
          {
            id: 'ten-million-minted',
            title: '$10 Million DigiDollars Minted',
            date: '2027-05-31',
            status: 'pending',
            description: 'Total DigiDollar supply reaches $10 million milestone'
          },
          {
            id: 'ecosystem-maturity',
            title: 'Ecosystem Maturity Milestone',
            date: '2027-06-30',
            status: 'pending',
            description: 'DigiDollar ecosystem reaches maturity with multiple integrations'
          }
        ]
      },
      {
        id: 'phase6',
        title: 'DigiByte Core v10.3 TBD',
        subtitle: 'Algorithm Transition',
        timeRange: '2027 - 2029',
        startDate: '2027-01-01',
        endDate: '2029-12-31',
        status: 'pending',
        progress: 0,
        icon: <UpdateIcon />,
        color: '#666666',
        description: 'Implementation of quantum-proof algorithms in DigiByte Core v10.3, ensuring long-term security against quantum computing threats with Bitcoin Core v30 merge.',
        keyFeatures: [
          '🔄 Algorithm transition planning',
          '🛡️ Quantum-resistant algo research',
          '⛏️ Mining ecosystem adaptation',
          '🔐 Enhanced security implementation'
        ],
        milestones: [
          {
            id: 'community-feedback',
            title: 'Gather Detailed Community Feedback',
            date: '2027-03-31',
            status: 'pending',
            description: 'Collect comprehensive community input on algorithm transition'
          },
          {
            id: 'analyze-digidollar-performance',
            title: 'Analyze v9.26 DigiDollar Performance',
            date: '2027-04-30',
            status: 'pending',
            description: 'Comprehensive analysis of DigiDollar v9.26 performance and adoption metrics'
          },
          {
            id: 'research-mining-algos',
            title: 'Research Alternative Mining Algos',
            date: '2027-06-30',
            status: 'pending',
            description: 'Evaluate alternative mining algorithms for DigiByte'
          },
          {
            id: 'research-quantum-algos',
            title: 'Research Quantum Proof/Resistant Algos',
            date: '2027-09-30',
            status: 'pending',
            description: 'Research quantum-resistant cryptographic algorithms'
          },
          {
            id: 'analyze-quantum-issues',
            title: 'Analyze Current Architecture Issues with Quantum Computing',
            date: '2027-12-31',
            status: 'pending',
            description: 'Analyze potential quantum computing vulnerabilities'
          },
          {
            id: 'merge-bitcoin-v30',
            title: 'Merge Bitcoin Core v30.0',
            date: '2028-03-31',
            status: 'pending',
            description: 'Merge Bitcoin Core version 30 into DigiByte'
          },
          {
            id: 'wallet-development',
            title: 'Wallet Development',
            date: '2028-05-31',
            status: 'pending',
            description: 'Develop DigiByte Core v10.3 wallet with quantum-resistant algorithms'
          },
          {
            id: 'v10.3-wallet-release',
            title: 'Wallet Release',
            date: '2028-06-30',
            status: 'pending',
            description: 'Release DigiByte Core v10.3 wallet with new algorithms'
          },
          {
            id: 'soft-hard-fork',
            title: 'Soft Fork/Hard Fork',
            date: '2029-01-01',
            status: 'pending',
            description: 'Execute soft fork followed by hard fork for quantum-proof algorithm transition'
          }
        ]
      }
    ]
  };

  /**
   * WebSocket connection for real-time roadmap updates
   */
  useEffect(() => {
    const socket = new WebSocket(config.wsBaseUrl);

    socket.onopen = () => {
      console.log('Roadmap WebSocket connection established');
      // Subscribe to roadmap updates
      socket.send(JSON.stringify({ 
        type: 'subscribeRoadmap', 
        data: { clientId: `roadmap-${Date.now()}` } 
      }));
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'roadmapUpdate') {
        // Update specific milestone status
        setRoadmapData(prevData => {
          const newData = { ...prevData };
          const { milestoneId, status, completionDate } = message.data;
          
          // Find and update the milestone
          newData.phases.forEach(phase => {
            const milestone = phase.milestones.find(m => m.id === milestoneId);
            if (milestone) {
              milestone.status = status;
              if (completionDate) {
                milestone.completionDate = completionDate;
              }
              // Recalculate phase progress
              phase.progress = calculatePhaseProgress(phase.milestones);
            }
          });
          
          // Recalculate overall progress
          newData.overallProgress = calculateOverallProgress(newData.phases);
          
          return newData;
        });
      }
    };

    socket.onclose = () => {
      console.log('Roadmap WebSocket connection closed');
    };

    socket.onerror = (error) => {
      console.error('Roadmap WebSocket error:', error);
    };

    // Set initial data
    setRoadmapData(initialRoadmapData);
    setLoading(false);

    return () => {
      socket.close();
    };
  }, []);

  /**
   * Calculate phase progress based on milestone completion
   */
  const calculatePhaseProgress = (milestones) => {
    const completed = milestones.filter(m => m.status === 'completed').length;
    return Math.round((completed / milestones.length) * 100);
  };

  /**
   * Calculate overall roadmap progress
   */
  const calculateOverallProgress = (phases) => {
    const totalMilestones = phases.reduce((sum, phase) => sum + phase.milestones.length, 0);
    const completedMilestones = phases.reduce((sum, phase) => 
      sum + phase.milestones.filter(m => m.status === 'completed').length, 0
    );
    return Math.round((completedMilestones / totalMilestones) * 100);
  };

  /**
   * Toggle phase expansion
   */
  const togglePhaseExpansion = (phaseId) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseId]: !prev[phaseId]
    }));
  };

  /**
   * Get status color based on milestone/phase status
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'in-progress': return '#ff9800';
      case 'pending': return '#666666';
      default: return '#666666';
    }
  };

  /**
   * Get status icon based on milestone status
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon sx={{ fontSize: 20 }} />;
      case 'in-progress': return <RadioButtonUncheckedIcon sx={{ fontSize: 20 }} />;
      case 'pending': return <HourglassEmptyIcon sx={{ fontSize: 20 }} />;
      default: return <RadioButtonUncheckedIcon sx={{ fontSize: 20 }} />;
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM yyyy');
    } catch {
      return dateString;
    }
  };

  /**
   * Get upcoming milestones from all phases
   */
  const getUpcomingMilestones = () => {
    const upcoming = [];
    roadmapData?.phases.forEach(phase => {
      if (phase.status === 'in-progress' || phase.status === 'pending') {
        const pendingMilestones = phase.milestones.filter(m => m.status === 'pending');
        pendingMilestones.forEach(milestone => {
          upcoming.push({
            ...milestone,
            phaseId: phase.id,
            phaseTitle: phase.title,
            phaseStatus: phase.status
          });
        });
      }
    });
    return upcoming;
  };

  /**
   * HeroSection - Page header with title and overview
   */
  const HeroSection = () => (
    <Box sx={{ mb: 6, textAlign: 'center' }}>
      <Typography 
        variant="h2" 
        fontWeight="bold" 
        sx={{ 
          mb: 2,
          fontSize: { xs: '2rem', md: '3rem' },
          background: 'linear-gradient(45deg, #002352, #0066cc)',
          backgroundClip: 'text',
          textFillColor: 'transparent',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}
      >
        DigiByte Core Development Roadmap
      </Typography>
      <Typography 
        variant="h5" 
        color="text.secondary" 
        sx={{ mb: 3, fontSize: { xs: '1.1rem', md: '1.5rem' } }}
      >
        Next Three Years: 2025 - 2028
      </Typography>
      <Typography 
        variant="body1" 
        sx={{ 
          maxWidth: '800px', 
          mx: 'auto', 
          mb: 2,
          fontSize: { xs: '0.95rem', md: '1.1rem' },
          lineHeight: 1.8
        }}
      >
        DigiByte has been under continuous development since 2013, with hundreds of contributors from around the world 
        helping to build one of the most secure, fast, and decentralized blockchains. This roadmap outlines the core 
        development milestones for the next three years.
      </Typography>
      <Typography 
        variant="body1" 
        sx={{ 
          maxWidth: '800px', 
          mx: 'auto', 
          mb: 2,
          fontSize: { xs: '0.95rem', md: '1.1rem' },
          lineHeight: 1.8
        }}
      >

      </Typography>
      
      <Paper 
        elevation={1} 
        sx={{ 
          maxWidth: '800px', 
          mx: 'auto', 
          mb: 4,
          p: 2,
          borderRadius: '8px',
          bgcolor: 'rgba(0, 123, 255, 0.05)',
          border: '1px solid rgba(0, 123, 255, 0.2)'
        }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: { xs: '0.85rem', md: '0.95rem' },
            lineHeight: 1.6,
            color: 'text.secondary',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1
          }}
        >
          <strong style={{ color: '#0066cc' }}>Note:</strong>
          This roadmap applies strictly core DigiByte protocol blockchain development. DigiByte is integrated into hundreds of 
          third-party exchanges, wallets, and other platforms. Users will need to look into those individually as this 
          roadmap focuses solely on DGB core blockchain protocol development.
        </Typography>
      </Paper>
    </Box>
  );

  /**
   * DigiDollar Launch Banner - Celebration announcement for May 1, 2026
   */
  const DigiDollarLaunchBanner = () => (
    <Card
      elevation={8}
      sx={{
        mb: 6,
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #002352 0%, #0066cc 50%, #002352 100%)',
        border: '3px solid #ffb74d',
        position: 'relative'
      }}
    >
      <CardContent sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2, gap: 2 }}>
          <RocketLaunchIcon sx={{ fontSize: { xs: '2rem', md: '3rem' }, color: '#ffb74d' }} />
          <Typography
            variant="h3"
            fontWeight="900"
            sx={{
              color: 'white',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
              textShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}
          >
            DigiDollar v9.26 Mainnet Release
          </Typography>
          <RocketLaunchIcon sx={{ fontSize: { xs: '2rem', md: '3rem' }, color: '#ffb74d' }} />
        </Box>

        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            color: '#ffb74d',
            mb: 2,
            fontSize: { xs: '1.3rem', sm: '1.6rem', md: '2rem' }
          }}
        >
          May 1, 2026
        </Typography>

        <Divider sx={{ maxWidth: '200px', mx: 'auto', mb: 2, borderColor: 'rgba(255,183,77,0.5)', borderWidth: 2 }} />

        <Typography
          variant="h6"
          sx={{
            color: 'rgba(255,255,255,0.95)',
            mb: 2,
            fontWeight: 600,
            fontSize: { xs: '0.95rem', md: '1.15rem' }
          }}
        >
          World's First Truly Decentralized Stablecoin on a UTXO Blockchain
        </Typography>

        <Grid container spacing={2} justifyContent="center" sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <Typography variant="body2" sx={{ color: '#ffb74d', fontWeight: 'bold' }}>
                Miner Signaling Begins
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                May 1, 2026
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <Typography variant="body2" sx={{ color: '#ffb74d', fontWeight: 'bold' }}>
                Activation Window
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                May 1, 2026 → May 1, 2028
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <Typography variant="body2" sx={{ color: '#ffb74d', fontWeight: 'bold' }}>
                Threshold Required
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                75% Miner Support
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255,255,255,0.8)',
            fontStyle: 'italic',
            maxWidth: '700px',
            mx: 'auto'
          }}
        >
          DigiDollar activated on testnet. Reach out to mining pools, wallets & exchanges to support v9.26 upgrade.
        </Typography>
      </CardContent>
    </Card>
  );

  /**
   * TimelineVisualization - Interactive timeline component
   */
  const TimelineVisualization = () => {
    const currentDate = new Date();
    
    return (
      <Box sx={{ mb: 6, mt: 6 }}>
        <Typography 
          variant="h3" 
          fontWeight="bold" 
          sx={{ 
            mb: 6, 
            textAlign: 'center',
            background: 'linear-gradient(45deg, #002352, #0066cc)',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Development Timeline
        </Typography>
        
        <Timeline position={isMobile ? "right" : "alternate"}>
          {roadmapData?.phases.map((phase, index) => {
            const isCurrentPhase = phase.status === 'in-progress';
            
            return (
              <TimelineItem key={phase.id}>
                {!isMobile && (
                  <TimelineOppositeContent 
                    sx={{ 
                      m: 'auto 0',
                      '& .MuiTypography-root': {
                        fontWeight: isCurrentPhase ? 'bold' : 'normal',
                        fontSize: isCurrentPhase ? '1.1rem' : '0.875rem',
                        color: isCurrentPhase ? '#002352' : 'text.secondary'
                      }
                    }}
                  >
                    <Typography>{phase.timeRange}</Typography>
                    {isCurrentPhase && (
                      <Chip 
                        label="CURRENT" 
                        size="small" 
                        sx={{ 
                          mt: 1,
                          bgcolor: '#ff9800',
                          color: 'white',
                          fontWeight: 'bold',
                          animation: `${pulse} 2s infinite`
                        }}
                      />
                    )}
                  </TimelineOppositeContent>
                )}
                
                <TimelineSeparator>
                  <TimelineConnector 
                    sx={{ 
                      bgcolor: index === 0 ? 'transparent' : phase.status === 'completed' ? '#4caf50' : '#e0e0e0',
                      width: phase.status === 'completed' ? 4 : 2
                    }} 
                  />
                  <TimelineDot 
                    sx={{ 
                      bgcolor: getStatusColor(phase.status),
                      width: isCurrentPhase ? 70 : 60,
                      height: isCurrentPhase ? 70 : 60,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isCurrentPhase 
                        ? '0 0 0 4px rgba(255, 152, 0, 0.3), 0 8px 20px rgba(0,0,0,0.3)'
                        : '0 4px 10px rgba(0,0,0,0.2)',
                      border: isCurrentPhase ? '3px solid white' : 'none',
                      transition: 'all 0.3s',
                      animation: isCurrentPhase ? `${pulse} 2s infinite` : 'none',
                      '& svg': {
                        fontSize: isCurrentPhase ? 35 : 28
                      }
                    }}
                  >
                    {phase.icon}
                  </TimelineDot>
                  <TimelineConnector 
                    sx={{ 
                      bgcolor: phase.status === 'completed' ? '#4caf50' : '#e0e0e0',
                      width: phase.status === 'completed' ? 4 : 2
                    }} 
                  />
                </TimelineSeparator>
                
                <TimelineContent sx={{ py: '12px', px: 2 }}>
                  <Card 
                    elevation={isCurrentPhase ? 8 : 3}
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      border: isCurrentPhase ? '2px solid #ff9800' : 'none',
                      background: isCurrentPhase 
                        ? 'linear-gradient(135deg, #fffcf5 0%, #fff8e1 100%)'
                        : 'white',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 15px 30px rgba(0,0,0,0.15)'
                      }
                    }}
                    onClick={() => togglePhaseExpansion(phase.id)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Typography 
                            variant={isCurrentPhase ? "h5" : "h6"} 
                            fontWeight="bold"
                            sx={{ color: isCurrentPhase ? '#002352' : 'inherit' }}
                          >
                            {phase.title}
                          </Typography>
                          {isCurrentPhase && !isMobile && (
                            <Chip 
                              label="IN PROGRESS" 
                              size="small" 
                              sx={{ 
                                bgcolor: '#ff9800',
                                color: 'white',
                                fontWeight: 'bold'
                              }}
                            />
                          )}
                        </Box>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontWeight: isCurrentPhase ? 600 : 400 }}
                        >
                          {phase.subtitle}
                        </Typography>
                        {isMobile && (
                          <Typography variant="caption" color="text.secondary">
                            {phase.timeRange}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <Chip 
                            label={`${phase.milestones.filter(m => m.status === 'completed').length}/${phase.milestones.length} milestones`}
                            size="small"
                            icon={<CheckCircleIcon sx={{ fontSize: '16px !important' }} />}
                            sx={{ 
                              height: 24,
                              fontSize: '0.75rem',
                              bgcolor: phase.milestones.filter(m => m.status === 'completed').length > 0 
                                ? 'rgba(76, 175, 80, 0.12)' 
                                : 'rgba(0, 0, 0, 0.08)',
                              fontWeight: 'bold',
                              '& .MuiChip-icon': {
                                color: phase.milestones.filter(m => m.status === 'completed').length > 0 
                                  ? '#4caf50' 
                                  : 'rgba(0, 0, 0, 0.4)'
                              }
                            }}
                          />
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'text.secondary',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              fontStyle: 'italic'
                            }}
                          >
                            Click to {expandedPhases[phase.id] ? 'hide' : 'view'} details
                            {!expandedPhases[phase.id] && <ExpandMoreIcon sx={{ fontSize: 16 }} />}
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton 
                        size="small"
                        sx={{ 
                          bgcolor: isCurrentPhase ? '#ff9800' : 'rgba(0, 0, 0, 0.04)',
                          color: isCurrentPhase ? 'white' : 'inherit',
                          '&:hover': {
                            bgcolor: isCurrentPhase ? '#f57c00' : 'rgba(0,0,0,0.08)'
                          }
                        }}
                      >
                        {expandedPhases[phase.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                    
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" fontWeight="bold">
                          Progress
                        </Typography>
                        <Typography variant="caption" fontWeight="bold">
                          {phase.progress}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={phase.progress} 
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            background: phase.status === 'completed' 
                              ? 'linear-gradient(90deg, #4caf50 0%, #66bb6a 100%)'
                              : phase.status === 'in-progress'
                              ? 'linear-gradient(90deg, #ff9800 0%, #ffb74d 100%)'
                              : 'linear-gradient(90deg, #9e9e9e 0%, #bdbdbd 100%)'
                          }
                        }}
                      />
                    </Box>
                    
                    {phase.status === 'in-progress' && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255, 152, 0, 0.1)', borderRadius: 2 }}>
                        <Typography variant="caption" fontWeight="bold" color="#ff6500">
                          NEXT: {phase.milestones.find(m => m.status === 'pending')?.title}
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Expandable Milestones in Timeline */}
                    <Collapse in={expandedPhases[phase.id]}>
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                          Milestones ({phase.milestones.filter(m => m.status === 'completed').length}/{phase.milestones.length})
                        </Typography>
                        <Stack spacing={1}>
                          {phase.milestones.map((milestone) => (
                            <Box 
                              key={milestone.id}
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                p: 1,
                                borderRadius: 1,
                                bgcolor: milestone.status === 'completed' 
                                  ? 'rgba(76, 175, 80, 0.08)'
                                  : milestone.status === 'in-progress'
                                  ? 'rgba(255, 152, 0, 0.08)'
                                  : 'transparent'
                              }}
                            >
                              <Box sx={{ mr: 1 }}>
                                {getStatusIcon(milestone.status)}
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: milestone.status === 'in-progress' ? 600 : 400,
                                    textDecoration: milestone.status === 'completed' ? 'line-through' : 'none',
                                    color: milestone.status === 'completed' ? 'text.secondary' : 'inherit'
                                  }}
                                >
                                  {milestone.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(milestone.date)}
                                </Typography>
                              </Box>
                              <Chip 
                                label={milestone.status.toUpperCase()} 
                                size="small"
                                sx={{ 
                                  height: 20,
                                  fontSize: '0.7rem',
                                  bgcolor: getStatusColor(milestone.status),
                                  color: 'white'
                                }}
                              />
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    </Collapse>
                  </Card>
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      </Box>
    );
  };

  /**
   * PhaseCards - Detailed phase information cards
   */
  const PhaseCards = () => (
    <Grid container spacing={3} sx={{ mb: 6 }}>
      {roadmapData?.phases.map((phase) => (
        <Grid item xs={12} key={phase.id}>
          <Card 
            elevation={phase.status === 'in-progress' ? 8 : 3}
            sx={{
              borderRadius: '16px',
              overflow: 'hidden',
              position: 'relative',
              background: phase.status === 'in-progress' 
                ? 'linear-gradient(135deg, #fff8e1 0%, #ffffff 100%)'
                : 'white',
              border: phase.status === 'in-progress' ? '2px solid #ff9800' : 'none',
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
              }
            }}
          >
            {/* Status Banner */}
            <Box 
              sx={{ 
                height: 6,
                background: phase.status === 'completed' 
                  ? 'linear-gradient(90deg, #4caf50 0%, #66bb6a 100%)'
                  : phase.status === 'in-progress'
                  ? 'linear-gradient(90deg, #ff9800 0%, #ffb74d 100%)'
                  : 'linear-gradient(90deg, #9e9e9e 0%, #bdbdbd 100%)'
              }}
            />
            
            <CardContent sx={{ p: 4 }}>
              {/* Phase Header */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  mb: 3
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box 
                      sx={{ 
                        mr: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 60,
                        height: 60,
                        borderRadius: '12px',
                        background: phase.status === 'in-progress'
                          ? 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)'
                          : `linear-gradient(135deg, ${getStatusColor(phase.status)} 0%, ${getStatusColor(phase.status)} 100%)`,
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        '& svg': {
                          fontSize: 32
                        }
                      }}
                    >
                      {phase.icon}
                    </Box>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                        <Typography 
                          variant="h4" 
                          fontWeight="bold"
                          sx={{ 
                            color: phase.status === 'in-progress' ? '#002352' : 'inherit'
                          }}
                        >
                          {phase.title}
                        </Typography>
                        {phase.status === 'in-progress' && (
                          <Chip 
                            label="CURRENT PHASE" 
                            size="small"
                            sx={{ 
                              bgcolor: '#ff9800',
                              color: 'white',
                              fontWeight: 'bold',
                              animation: 'pulse 2s infinite'
                            }}
                          />
                        )}
                      </Box>
                      <Typography 
                        variant="body1" 
                        color="text.secondary"
                        sx={{ fontWeight: 500 }}
                      >
                        {phase.subtitle} • {phase.timeRange}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      mb: 3,
                      lineHeight: 1.8,
                      color: 'text.secondary'
                    }}
                  >
                    {phase.description}
                  </Typography>
                  
                  {/* Key Features */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {phase.keyFeatures.map((feature, index) => (
                      <Grid item xs={12} md={6} key={index}>
                        <Paper 
                          elevation={0}
                          sx={{ 
                            p: 2,
                            bgcolor: phase.status === 'in-progress' 
                              ? 'rgba(255, 152, 0, 0.08)'
                              : 'rgba(0, 0, 0, 0.03)',
                            borderRadius: '8px',
                            transition: 'all 0.3s',
                            '&:hover': {
                              bgcolor: phase.status === 'in-progress' 
                                ? 'rgba(255, 152, 0, 0.12)'
                                : 'rgba(0, 0, 0, 0.05)'
                            }
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              fontWeight: 500
                            }}
                          >
                            {feature}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
                
                <Box sx={{ ml: 3, textAlign: 'center', minWidth: 120 }}>
                  <Box 
                    sx={{ 
                      width: 100,
                      height: 100,
                      mx: 'auto',
                      mb: 2,
                      position: 'relative'
                    }}
                  >
                    <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="#e0e0e0"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke={getStatusColor(phase.status)}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - phase.progress / 100)}`}
                        style={{ transition: 'stroke-dashoffset 0.5s' }}
                      />
                    </svg>
                    <Typography 
                      variant="h3" 
                      fontWeight="bold" 
                      sx={{ 
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: getStatusColor(phase.status)
                      }}
                    >
                      {phase.progress}%
                    </Typography>
                  </Box>
                  <Chip 
                    label={phase.status.replace('-', ' ').toUpperCase()} 
                    size="small"
                    sx={{ 
                      bgcolor: getStatusColor(phase.status),
                      color: 'white',
                      fontWeight: 'bold',
                      px: 2
                    }}
                  />
                </Box>
              </Box>
              
              {/* Progress Bar */}
              <LinearProgress 
                variant="determinate" 
                value={phase.progress} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  mb: 3,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    bgcolor: getStatusColor(phase.status)
                  }
                }}
              />
              
              {/* Expandable Milestones */}
              <Box>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    mb: 2
                  }}
                  onClick={() => togglePhaseExpansion(phase.id)}
                >
                  <Typography variant="h6" fontWeight="bold">
                    Milestones ({phase.milestones.filter(m => m.status === 'completed').length}/{phase.milestones.length})
                  </Typography>
                  <IconButton size="small">
                    {expandedPhases[phase.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                
                <Collapse in={expandedPhases[phase.id]}>
                  <Stack spacing={2}>
                    {phase.milestones.map((milestone) => (
                      <Paper 
                        key={milestone.id}
                        elevation={milestone.status === 'completed' ? 0 : 2}
                        sx={{ 
                          p: 2.5,
                          borderLeft: `5px solid ${getStatusColor(milestone.status)}`,
                          bgcolor: milestone.status === 'completed' 
                            ? 'rgba(76, 175, 80, 0.05)' 
                            : milestone.status === 'in-progress'
                            ? 'rgba(255, 152, 0, 0.05)'
                            : 'white',
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'translateX(5px)',
                            boxShadow: milestone.status !== 'completed' ? 4 : 0
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                            <Box 
                              sx={{ 
                                mr: 2, 
                                mt: 0.5,
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                bgcolor: milestone.status === 'completed' 
                                  ? 'rgba(76, 175, 80, 0.1)' 
                                  : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {getStatusIcon(milestone.status)}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography 
                                variant="subtitle1" 
                                fontWeight="bold"
                                sx={{ 
                                  color: milestone.status === 'completed' 
                                    ? 'rgba(0, 0, 0, 0.6)' 
                                    : 'inherit',
                                  textDecoration: milestone.status === 'completed' 
                                    ? 'line-through' 
                                    : 'none'
                                }}
                              >
                                {milestone.title}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ 
                                  mb: 1,
                                  opacity: milestone.status === 'completed' ? 0.7 : 1
                                }}
                              >
                                {milestone.description}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Typography variant="caption" color="text.secondary">
                                  <strong>Target:</strong> {formatDate(milestone.date)}
                                </Typography>
                                {milestone.completionDate && (
                                  <Typography variant="caption" sx={{ color: '#4caf50' }}>
                                    <strong>✓ Completed:</strong> {formatDate(milestone.completionDate)}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Box>
                          <Chip 
                            label={milestone.status.toUpperCase()} 
                            size="small"
                            sx={{ 
                              bgcolor: getStatusColor(milestone.status),
                              color: 'white',
                              fontWeight: 'bold',
                              minWidth: 80
                            }}
                          />
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                </Collapse>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  /**
   * Main render
   */
  return (
    <Box 
      sx={{ 
        py: 4, 
        backgroundImage: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
        minHeight: '100vh'
      }}
    >
      <Container maxWidth="lg">
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography variant="h5">Loading roadmap...</Typography>
          </Box>
        ) : (
          <>
            <HeroSection />
            <DigiDollarLaunchBanner />
            {!isMobile && <TimelineVisualization />}
            <PhaseCards />
            
            {/* Footer Note */}
            <Box sx={{ textAlign: 'center', mt: 6, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Last Updated: {roadmapData && formatDate(roadmapData.lastUpdated)} • 
                This roadmap represents the core blockchain development milestones for DigiByte's next three years
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                DigiByte: In continuous development since 2013 with hundreds of global contributors
              </Typography>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default RoadmapPage;