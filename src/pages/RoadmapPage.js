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
    overallProgress: 40, // 40% overall progress as of August 2025
    phases: [
      {
        id: 'phase1',
        title: 'DigiByte v8.26 Taproot Release',
        subtitle: 'Bitcoin v26.2 Merge',
        timeRange: 'June - October 2025',
        startDate: '2025-08-01',
        endDate: '2025-10-31',
        status: 'in-progress',
        progress: 87,
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
            status: 'pending',
            description: 'First official release of DigiByte v8.26'
          }
        ]
      },
      {
        id: 'phase2',
        title: 'DigiDollar Implementation Specs',
        subtitle: 'Initial Design Phase',
        timeRange: 'June - October 2025',
        startDate: '2025-06-01',
        endDate: '2025-11-30',
        status: 'in-progress',
        progress: 25,
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
            date: '2025-10-01',
            status: 'pending',
            description: 'Design Pay-to-Taproot contract structure for DigiDollar minting/redemption'
          },
          {
            id: 'define-collateral-ratios',
            title: 'Define Collateral Ratio System',
            date: '2025-10-05',
            status: 'pending',
            description: 'Define sliding collateral ratios (400% at 1 month to 100% at 10 years)'
          },
          {
            id: 'digidollar-opcodes-spec',
            title: 'DigiDollar Opcodes Specification',
            date: '2025-10-08',
            status: 'pending',
            description: 'Define new opcodes: OP_CHECKDOLLAR, OP_BURNDOLLAR, OP_MINTDOLLAR'
          },
          {
            id: 'design-oracle-infrastructure',
            title: 'Oracle Network Architecture',
            date: '2025-10-12',
            status: 'pending',
            description: 'Design 15-oracle system with 8-of-15 Schnorr threshold signatures'
          },
          {
            id: 'oracle-price-feed-spec',
            title: 'Oracle Price Feed Specification',
            date: '2025-10-15',
            status: 'pending',
            description: 'Define oracle price aggregation, update frequency, and failsafe mechanisms'
          },
          {
            id: 'mast-redemption-design',
            title: 'MAST Redemption Tree Design',
            date: '2025-10-18',
            status: 'pending',
            description: 'Design Merkle tree structure for multiple redemption paths and conditions'
          },
          {
            id: 'security-analysis',
            title: 'Security Analysis & Threat Modeling',
            date: '2025-10-22',
            status: 'pending',
            description: 'Comprehensive security analysis of DigiDollar attack vectors'
          },
          {
            id: 'economic-model-validation',
            title: 'Economic Model Validation',
            date: '2025-10-25',
            status: 'pending',
            description: 'Validate DigiDollar economics with simulations and stress tests'
          },
          {
            id: 'taproot-integration-spec',
            title: 'Taproot Integration Requirements',
            date: '2025-10-28',
            status: 'pending',
            description: 'Document all Taproot features required for DigiDollar functionality'
          },
          {
            id: 'finalize-technical-spec',
            title: 'Finalize Technical Specification',
            date: '2025-11-30',
            status: 'pending',
            description: 'Complete DigiDollar Implementation Specification for development'
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
        status: 'pending',
        progress: 0,
        icon: <TokenIcon />,
        color: '#666666',
        description: 'Implementation of DigiDollar v9.26 with new opcodes, oracle system, and Taproot-based stablecoin functionality.',
        keyFeatures: [
          '💻 OP_DIGIDOLLAR implementation',
          '🔧 Oracle network deployment',
          '🧪 MAST & Taproot integration',
          '🔐 Consensus rule updates'
        ],
        milestones: [
          {
            id: 'op-digidollar-implementation',
            title: 'OP_DIGIDOLLAR (0xbb) Implementation',
            date: '2025-11-01',
            status: 'pending',
            description: 'Implement core OP_DIGIDOLLAR opcode for marking DigiDollar outputs'
          },
          {
            id: 'collateral-time-lock',
            title: 'Time-Locked Collateral Mechanism',
            date: '2025-11-05',
            status: 'pending',
            description: 'Implement sliding collateral ratios: 400% (30 days) to 100% (10 years)'
          },
          {
            id: 'redemption-mechanism',
            title: 'Redemption Mechanism',
            date: '2025-11-10',
            status: 'pending',
            description: 'P2TR output creation, Schnorr signatures, OP_CHECKSIGADD implementation'
          },
          {
            id: 'oracle-price-feeds',
            title: 'Oracle Price Feed Implementation',
            date: '2025-12-01',
            status: 'pending',
            description: 'Implement DNS-based price feeds and exchange data aggregation'
          },
          {
            id: 'mast-implementation',
            title: 'MAST Implementation',
            date: '2025-12-15',
            status: 'pending',
            description: 'Build Merkle tree redemption paths with hidden script branches'
          },
          {
            id: 'advanced-features',
            title: 'Advanced Features',
            date: '2026-01-01',
            status: 'pending',
            description: 'Key path optimization, PSBT support, batch verification'
          },
          {
            id: 'wallet-enhancement',
            title: 'Wallet Enhancement',
            date: '2026-01-15',
            status: 'pending',
            description: 'GUI integration, privacy indicators, DigiDollar transaction support'
          },
          {
            id: 'consensus-validation-rules',
            title: 'Consensus Validation Rules',
            date: '2026-02-15',
            status: 'pending',
            description: 'Implement new transaction validation rules for DigiDollar'
          },
          {
            id: 'digidollar-testnet',
            title: 'DigiDollar Testnet Deployment',
            date: '2026-02-20',
            status: 'pending',
            description: 'DigiDollar fully functional on testnet with validation'
          },
          {
            id: 'initial-release',
            title: 'Initial Release',
            date: '2026-02-28',
            status: 'pending',
            description: 'Initial v9.26 release with DigiDollar functionality'
          }
        ]
      },
      {
        id: 'phase4',
        title: 'DigiByte v9.26 DigiDollar Soft Fork',
        subtitle: 'Mainnet Activation',
        timeRange: 'March - June 2026',
        startDate: '2026-03-01',
        endDate: '2026-06-30',
        status: 'pending',
        progress: 0,
        icon: <SpeedIcon />,
        color: '#666666',
        description: 'DigiDollar soft fork activation with new consensus rules and opcodes for DigiByte v9.26.',
        keyFeatures: [
          '🚀 DigiByte v9.26 mainnet release',
          '🔄 Soft fork implementation',
          '⛏️ Miner signaling process',
          '✅ Consensus activation'
        ],
        milestones: [
          {
            id: 'v9.26-rc1',
            title: 'DigiByte v9.26 Release Candidate 1',
            date: '2026-03-01',
            status: 'pending',
            description: 'First release candidate with OP_DIGIDOLLAR and consensus changes'
          },
          {
            id: 'mining-pool-coordination',
            title: 'Mining Pool Coordination',
            date: '2026-03-15',
            status: 'pending',
            description: 'Coordinate with mining pools for BIP9 soft fork signaling'
          },
          {
            id: 'v9.26-rc2',
            title: 'DigiByte v9.26 Release Candidate 2',
            date: '2026-04-01',
            status: 'pending',
            description: 'Second release candidate with performance optimizations'
          },
          {
            id: 'node-upgrade-campaign',
            title: 'Node Upgrade Campaign',
            date: '2026-04-15',
            status: 'pending',
            description: 'Community outreach for node operators to upgrade to v9.26'
          },
          {
            id: 'v9.26-final-release',
            title: 'DigiByte v9.26 Final Release',
            date: '2026-05-01',
            status: 'pending',
            description: 'Final release with all DigiDollar features and opcodes'
          },
          {
            id: 'bip9-parameters',
            title: 'BIP9 Activation Parameters',
            date: '2026-04-20',
            status: 'pending',
            description: 'Set soft fork activation parameters and start block height'
          },
          {
            id: 'signaling-period-start',
            title: 'Miner Signaling Period Begins',
            date: '2026-05-01',
            status: 'pending',
            description: 'Start of 2016-block signaling periods for soft fork'
          },
          {
            id: 'signaling-threshold',
            title: '75% Signaling Threshold',
            date: '2026-05-20',
            status: 'pending',
            description: 'Monitor for 75% miner support over difficulty period'
          },
          {
            id: 'soft-fork-lock-in',
            title: 'Soft Fork Lock-In',
            date: '2026-06-01',
            status: 'pending',
            description: 'Soft fork locks in after meeting activation threshold'
          },
          {
            id: 'digidollar-activation',
            title: 'DigiDollar Soft Fork Activation',
            date: '2026-06-30',
            status: 'pending',
            description: 'DigiDollar consensus rules activate on mainnet'
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
            id: 'hard-fork-activation',
            title: 'Successful DigiDollar Hard Fork Activation',
            date: '2026-07-01',
            status: 'pending',
            description: 'DigiDollar hard fork successfully activated on mainnet'
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