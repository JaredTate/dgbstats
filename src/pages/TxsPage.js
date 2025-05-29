import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Container, Typography, Grid, Button, Card, CardContent, 
  Box, Divider, Chip, useMediaQuery, useTheme, Pagination,
  LinearProgress, TextField, InputAdornment, IconButton,
  Collapse, List, ListItem, ListItemText, Tooltip, Badge,
  ToggleButton, ToggleButtonGroup, Fade, Zoom
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import SpeedIcon from '@mui/icons-material/Speed';
import StorageIcon from '@mui/icons-material/Storage';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TransactionsIcon from '@mui/icons-material/Sync';
import PoolIcon from '@mui/icons-material/Waves';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import MemoryIcon from '@mui/icons-material/Memory';
import config from '../config';

/**
 * Priority color mapping for transaction fee priorities
 * Each priority level has a unique color for visual identification
 */
const PRIORITY_COLORS = {
  'high': '#4caf50',    // Green - High priority
  'medium': '#ff9800',  // Orange - Medium priority
  'low': '#f44336',     // Red - Low priority
};

/**
 * Confirmation status colors
 */
const CONFIRMATION_COLORS = {
  0: '#ff9800',     // Orange - Unconfirmed
  1: '#ffeb3b',     // Yellow - 1 confirmation
  2: '#cddc39',     // Light green - 2 confirmations
  3: '#8bc34a',     // Green - 3 confirmations
  6: '#4caf50',     // Dark green - 6+ confirmations
};

/**
 * Hero section component for the TxsPage
 * Displays title, description, and real-time transaction information
 * @returns {JSX.Element} Hero section with page title and description
 */
const HeroSection = () => (
  <Card
    elevation={2}
    sx={{
      backgroundColor: '#f2f4f8',
      borderRadius: '12px',
      mb: 4,
      overflow: 'hidden',
      backgroundImage: 'linear-gradient(135deg, #f8f9fa 0%, #e8eef7 100%)',
      border: '1px solid rgba(0, 35, 82, 0.1)'
    }}
  >
    <CardContent sx={{ py: 4, textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
        <AccountBalanceWalletIcon sx={{ fontSize: '2.5rem', color: '#002352', mr: 2 }} />
        <Typography 
          variant="h2" 
          component="h1" 
          fontWeight="800" 
          sx={{ 
            color: '#002352',
            letterSpacing: '0.5px',
            fontSize: { xs: '1.8rem', sm: '2.3rem', md: '2.8rem' }
          }}
        >
          DigiByte Transaction Explorer
        </Typography>
      </Box>
      
      <Divider sx={{ maxWidth: '150px', mx: 'auto', mb: 3, borderColor: '#0066cc', borderWidth: 2 }} />
      
      <Typography 
        variant="subtitle1" 
        component="p" 
        sx={{ 
          maxWidth: '800px', 
          mx: 'auto',
          color: '#555',
          fontSize: '1.1rem'
        }}
      >
        Real-time mempool monitoring and transaction tracking. Watch as transactions flow through the DigiByte network with detailed fee analysis and confirmation tracking.
      </Typography>
    </CardContent>
  </Card>
);

/**
 * Loading state component displayed while mempool data is being fetched
 * @returns {JSX.Element} Loading card with spinner message
 */
const LoadingCard = () => (
  <Card elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: '12px' }}>
    <Typography variant="h5" sx={{ mb: 2 }}>Loading transaction data...</Typography>
    <LinearProgress sx={{ maxWidth: 300, mx: 'auto' }} />
  </Card>
);

/**
 * Empty state component displayed when no transactions match filters
 * @returns {JSX.Element} Empty state card
 */
const EmptyState = ({ message = "No transactions found" }) => (
  <Card elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: '12px' }}>
    <Typography variant="h5" color="text.secondary">
      {message}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
      Waiting for new transactions to arrive...
    </Typography>
  </Card>
);

/**
 * Get priority color from the predefined color mapping
 * @param {string} priority - Priority level (high/medium/low)
 * @returns {string} Hex color code for the priority
 */
const getPriorityColor = (priority) => {
  return PRIORITY_COLORS[priority?.toLowerCase()] || '#0066cc';
};

/**
 * Get confirmation color based on confirmation count
 * @param {number} confirmations - Number of confirmations
 * @returns {string} Hex color code for the confirmation status
 */
const getConfirmationColor = (confirmations) => {
  if (confirmations >= 6) return CONFIRMATION_COLORS[6];
  return CONFIRMATION_COLORS[confirmations] || CONFIRMATION_COLORS[0];
};

/**
 * Format number with thousands separators (commas)
 * @param {number} num - Number to format
 * @returns {string} Formatted number string with commas
 */
const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Format DGB value with proper decimal places
 * @param {number} value - Value in DGB
 * @returns {string} Formatted value string
 */
const formatDGB = (value) => {
  if (value === undefined || value === null) return '0.00000000';
  return value.toFixed(8);
};

/**
 * Format timestamp to relative time (e.g., "2 minutes ago")
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} Relative time string
 */
const formatRelativeTime = (timestamp) => {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

/**
 * Calculate total value from transaction outputs
 * @param {Array} outputs - Array of transaction outputs
 * @returns {number} Total value in DGB
 */
const calculateTotalValue = (outputs) => {
  if (!outputs || !Array.isArray(outputs)) return 0;
  return outputs.reduce((sum, output) => sum + (output.amount || output.value || 0), 0);
};

/**
 * Fee distribution chart component
 * Displays visual representation of fee ranges in mempool
 */
const FeeDistributionChart = ({ feeDistribution }) => {
  if (!feeDistribution) return null;
  
  const total = Object.values(feeDistribution).reduce((sum, count) => sum + count, 0);
  if (total === 0) return null;
  
  return (
    <Card elevation={2} sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Fee Distribution
      </Typography>
      <Box sx={{ display: 'flex', height: 40, borderRadius: 1, overflow: 'hidden', mb: 1 }}>
        {Object.entries(feeDistribution).map(([range, count]) => {
          const percentage = (count / total) * 100;
          const color = range === '500+' ? '#f44336' : 
                       range === '100-500' ? '#ff9800' :
                       range === '50-100' ? '#ffc107' :
                       range === '10-50' ? '#8bc34a' : '#4caf50';
          
          return (
            <Tooltip key={range} title={`${range} sat/byte: ${count} txs (${percentage.toFixed(1)}%)`}>
              <Box
                sx={{
                  width: `${percentage}%`,
                  backgroundColor: color,
                  transition: 'all 0.3s ease',
                  '&:hover': { opacity: 0.8 }
                }}
              />
            </Tooltip>
          );
        })}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
        <Typography variant="caption">Low fees</Typography>
        <Typography variant="caption">High fees</Typography>
      </Box>
    </Card>
  );
};

/**
 * Mempool statistics card component
 * Displays overall mempool metrics with enhanced visuals
 */
const MempoolStats = ({ stats, transactions }) => {
  const highPriorityCount = transactions.filter(tx => tx.priority === 'high').length;
  const memoryUsagePercent = stats.maxmempool ? (stats.usage / stats.maxmempool) * 100 : 0;
  
  return (
    <>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Card elevation={2} sx={{ textAlign: 'center', p: 2, height: '100%' }}>
                <PoolIcon sx={{ fontSize: '2rem', color: '#0066cc', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Mempool Size
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  {formatNumber(stats.size)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  transactions
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card elevation={2} sx={{ textAlign: 'center', p: 2, height: '100%' }}>
                <StorageIcon sx={{ fontSize: '2rem', color: '#0066cc', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Size
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  {stats.bytes ? (stats.bytes / 1048576).toFixed(2) : '0.00'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  MB
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card elevation={2} sx={{ textAlign: 'center', p: 2, height: '100%' }}>
                <AttachMoneyIcon sx={{ fontSize: '2rem', color: '#0066cc', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Avg Fee Rate
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  {stats.avgfee ? Math.round(stats.avgfee * 100000000 / 250) : 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  sat/byte
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card elevation={2} sx={{ textAlign: 'center', p: 2, height: '100%' }}>
                <SpeedIcon sx={{ fontSize: '2rem', color: PRIORITY_COLORS.high, mb: 1 }} />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  High Priority
                </Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ color: PRIORITY_COLORS.high }}>
                  {formatNumber(highPriorityCount)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  transactions
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <MemoryIcon sx={{ mr: 1, color: '#0066cc' }} />
              <Typography variant="subtitle2" color="text.secondary">
                Memory Usage
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={memoryUsagePercent} 
              sx={{ 
                height: 10, 
                borderRadius: 5,
                mb: 1,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: memoryUsagePercent > 80 ? '#f44336' : 
                                   memoryUsagePercent > 60 ? '#ff9800' : '#4caf50'
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption">
                {(stats.usage / 1048576).toFixed(1)} MB used
              </Typography>
              <Typography variant="caption">
                {(stats.maxmempool / 1048576).toFixed(0)} MB max
              </Typography>
            </Box>
            {stats.totalfee && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Total Fees: {formatDGB(stats.totalfee)} DGB
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
      {stats.feeDistribution && (
        <FeeDistributionChart feeDistribution={stats.feeDistribution} />
      )}
    </>
  );
};

/**
 * Search and filter controls
 */
const SearchAndFilter = ({ searchTerm, onSearchChange, filterPriority, onFilterChange, sortBy, onSortChange }) => {
  return (
    <Card elevation={2} sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by transaction ID..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={6} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FilterListIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <ToggleButtonGroup
              size="small"
              value={filterPriority}
              exclusive
              onChange={onFilterChange}
              aria-label="filter priority"
            >
              <ToggleButton value="all" aria-label="all">
                All
              </ToggleButton>
              <ToggleButton value="high" aria-label="high">
                High
              </ToggleButton>
              <ToggleButton value="medium" aria-label="medium">
                Medium
              </ToggleButton>
              <ToggleButton value="low" aria-label="low">
                Low
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Grid>
        <Grid item xs={6} md={4}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SortIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <ToggleButtonGroup
              size="small"
              value={sortBy}
              exclusive
              onChange={onSortChange}
              aria-label="sort by"
            >
              <ToggleButton value="time" aria-label="time">
                Time
              </ToggleButton>
              <ToggleButton value="value" aria-label="value">
                Value
              </ToggleButton>
              <ToggleButton value="fee" aria-label="fee">
                Fee
              </ToggleButton>
              <ToggleButton value="size" aria-label="size">
                Size
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
};

/**
 * Enhanced transaction card component with expandable details
 */
const TransactionCard = ({ transaction, index, isMobile, isConfirmed = false }) => {
  const [expanded, setExpanded] = useState(false);
  const totalValue = transaction.value || calculateTotalValue(transaction.outputs);
  
  return (
    <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }}>
      <Grid item xs={12}>
        <Card 
          elevation={2}
          sx={{
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            },
            overflow: 'hidden',
            borderLeft: `5px solid ${isConfirmed ? getConfirmationColor(transaction.confirmations || 0) : getPriorityColor(transaction.priority)}`,
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={expanded ? 12 : 3}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Transaction ID
                    </Typography>
                    <Box
                      component="a"
                      href={`https://digiexplorer.info/tx/${transaction.txid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        textDecoration: 'none',
                        color: 'inherit',
                        '&:hover': { color: '#0066cc' }
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        fontWeight="medium" 
                        sx={{ 
                          fontFamily: 'monospace',
                          bgcolor: 'rgba(0, 0, 0, 0.04)',
                          p: 0.5,
                          borderRadius: 1,
                          fontSize: { xs: '0.7rem', md: '0.8rem' },
                          wordBreak: 'break-all'
                        }}
                      >
                        {isMobile ? transaction.txid.substring(0, 16) + '...' : transaction.txid}
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    onClick={() => setExpanded(!expanded)}
                    size="small"
                    sx={{ ml: 1 }}
                  >
                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
              </Grid>
              
              {!expanded && (
                <>
                  <Grid item xs={6} sm={3} md={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AttachMoneyIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#0066cc' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          Value
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {formatNumber(Math.floor(totalValue))} DGB
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3} md={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AttachMoneyIcon sx={{ fontSize: '1rem', mr: 0.5, color: '#666' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          Fee
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {formatDGB(transaction.fee)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3} md={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <StorageIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#0066cc' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          Size
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {transaction.vsize || transaction.size} vB
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3} md={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTimeIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#0066cc' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          Time
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {formatRelativeTime(transaction.time || transaction.blocktime)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3} md={1.5}>
                    <Box>
                      {isConfirmed ? (
                        <Badge badgeContent={transaction.confirmations} color="success" max={6}>
                          <Chip 
                            icon={<CheckCircleIcon />}
                            label="Confirmed" 
                            size="small" 
                            color="success"
                            sx={{ fontWeight: 'medium', fontSize: '0.75rem' }} 
                          />
                        </Badge>
                      ) : (
                        <Chip 
                          icon={<SpeedIcon />}
                          label={transaction.priority?.charAt(0).toUpperCase() + transaction.priority?.slice(1) || 'Unknown'} 
                          size="small" 
                          sx={{ 
                            bgcolor: getPriorityColor(transaction.priority) + '20',
                            color: getPriorityColor(transaction.priority),
                            fontWeight: 'medium',
                            fontSize: '0.75rem'
                          }} 
                        />
                      )}
                    </Box>
                  </Grid>
                </>
              )}
            </Grid>
            
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <SwapHorizIcon sx={{ mr: 1 }} />
                    Inputs ({transaction.inputs?.length || 0})
                  </Typography>
                  <List dense>
                    {Array.isArray(transaction.inputs) && transaction.inputs.length > 0 ? (
                      transaction.inputs.map((input, idx) => (
                        <ListItem key={idx} sx={{ pl: 0 }}>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                {input.address || 'Unknown Address'}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {formatDGB(input.amount)} DGB
                                {input.txid && ` (${input.txid.substring(0, 8)}...)`}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))
                    ) : (
                      <ListItem sx={{ pl: 0 }}>
                        <ListItemText 
                          primary={
                            <Typography variant="body2" color="text.secondary">
                              No input data available
                            </Typography>
                          }
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <SwapHorizIcon sx={{ mr: 1, transform: 'rotate(180deg)' }} />
                    Outputs ({transaction.outputs?.length || 0})
                  </Typography>
                  <List dense>
                    {Array.isArray(transaction.outputs) && transaction.outputs.length > 0 ? (
                      transaction.outputs.map((output, idx) => (
                        <ListItem key={idx} sx={{ pl: 0 }}>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                {output.address || 'Unknown Address'}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {formatDGB(output.amount)} DGB
                                {output.type && ` (${output.type})`}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))
                    ) : (
                      <ListItem sx={{ pl: 0 }}>
                        <ListItemText 
                          primary={
                            <Typography variant="body2" color="text.secondary">
                              No output data available
                            </Typography>
                          }
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      <strong>Fee Rate:</strong> {transaction.fee_rate || Math.round((transaction.fee * 100000000) / (transaction.vsize || transaction.size))} sat/vB
                    </Typography>
                    {transaction.descendantcount !== undefined && (
                      <Typography variant="caption" color="text.secondary">
                        <strong>Descendants:</strong> {transaction.descendantcount} ({transaction.descendantsize} vB)
                      </Typography>
                    )}
                    {transaction.ancestorcount !== undefined && (
                      <Typography variant="caption" color="text.secondary">
                        <strong>Ancestors:</strong> {transaction.ancestorcount} ({transaction.ancestorsize} vB)
                      </Typography>
                    )}
                    {isConfirmed && transaction.blockhash && (
                      <Typography variant="caption" color="text.secondary">
                        <strong>Block:</strong> {transaction.blockheight} ({transaction.blockhash.substring(0, 10)}...)
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Collapse>
          </CardContent>
        </Card>
      </Grid>
    </Zoom>
  );
};

/**
 * Section header component
 */
const SectionHeader = ({ title, subtitle, icon: Icon }) => (
  <Box sx={{ mb: 3 }}>
    <Typography 
      variant="h4" 
      component="h2" 
      fontWeight="700" 
      sx={{ 
        color: '#002352',
        letterSpacing: '0.5px',
        mb: 1,
        display: 'flex',
        alignItems: 'center'
      }}
    >
      {Icon && <Icon sx={{ mr: 2, fontSize: '2rem' }} />}
      {title}
    </Typography>
    {subtitle && (
      <Typography 
        variant="body1" 
        color="text.secondary"
        sx={{ ml: Icon ? 6 : 0 }}
      >
        {subtitle}
      </Typography>
    )}
  </Box>
);

/**
 * Pagination controls component
 * Handles navigation between pages of transactions with responsive design
 */
const PaginationControls = ({ 
  currentPage, 
  totalPages, 
  onPrevPage, 
  onNextPage, 
  onPageChange, 
  isMobile, 
  isTablet 
}) => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    mt: 4, 
    flexDirection: { xs: 'column', sm: 'row' },
    alignItems: 'center',
    gap: 2
  }}>
    <Button 
      variant="contained" 
      onClick={onPrevPage} 
      disabled={currentPage === 0}
      startIcon={<ArrowBackIosNewIcon />}
      sx={{
        backgroundColor: '#002352',
        '&:hover': {
          backgroundColor: '#001a3e',
        },
        fontWeight: 'medium',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: { xs: '100%', sm: 'auto' },
      }}
    >
      Previous
    </Button>
    
    {!isMobile && !isTablet && (
      <Pagination 
        count={totalPages} 
        page={currentPage + 1} 
        onChange={onPageChange}
        color="primary"
        sx={{
          '& .MuiPaginationItem-root': {
            fontWeight: 'medium',
          },
          '& .Mui-selected': {
            backgroundColor: '#0066cc !important',
            color: 'white',
          }
        }}
      />
    )}
    
    <Button 
      variant="contained" 
      onClick={onNextPage} 
      disabled={currentPage >= totalPages - 1}
      endIcon={<ArrowForwardIosIcon />}
      sx={{
        backgroundColor: '#0066cc',
        '&:hover': {
          backgroundColor: '#0055aa',
        },
        fontWeight: 'medium',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: { xs: '100%', sm: 'auto' },
      }}
    >
      Next
    </Button>
  </Box>
);

/**
 * TxsPage component - Enhanced DigiByte transaction explorer
 * 
 * This page displays comprehensive transaction information including:
 * - Real-time mempool transactions with value, fee, and priority details
 * - Confirmed transactions with confirmation counts
 * - Advanced filtering and sorting capabilities
 * - Expandable transaction details with input/output information
 * - Visual fee distribution and mempool statistics
 * 
 * Features:
 * - WebSocket connection for real-time updates
 * - Search by transaction ID
 * - Filter by priority level
 * - Sort by time, value, fee, or size
 * - Responsive design with mobile optimization
 * - Smooth animations and transitions
 * - Accessibility features
 * 
 * @component
 * @returns {JSX.Element} Complete transaction explorer with real-time updates
 */
const TxsPage = () => {
  // Sample data for demonstration (remove when backend is implemented)
  const sampleMempoolData = {
    stats: {
      size: 234,
      bytes: 485672,
      usage: 685672,
      maxmempool: 300000000,
      minfee: 0.00001,
      avgfee: 0.00015,
      totalfee: 0.0351,
      feeDistribution: {
        '0-10': 23,
        '10-50': 89,
        '50-100': 67,
        '100-500': 45,
        '500+': 10
      }
    },
    transactions: [
      {
        txid: 'demo-e928e6daa81b93e2c7d072054b8a24aa27fc154d43df3d53cb920b0ffed09bce',
        size: 256,
        vsize: 256,
        fee: 0.00012345,
        value: 123.45678901,
        time: Date.now() / 1000 - 120,
        inputs: [
          { address: 'DSXnZTQABeBrJEU5b2vpnysoGiiZwjKKDY', amount: 125.0 }
        ],
        outputs: [
          { address: 'DTm8KnykGLXQaYJuJnJEzfrrkVVGdsE5k3', amount: 123.45678901 },
          { address: 'DSXnZTQABeBrJEU5b2vpnysoGiiZwjKKDY', amount: 1.54308754 }
        ],
        fee_rate: 48,
        priority: 'medium',
        confirmations: 0,
        descendantcount: 0,
        descendantsize: 0,
        ancestorcount: 0,
        ancestorsize: 0
      },
      {
        txid: 'demo-37f81a5ccddd8a2aefaa8d9d0053dc13a287f13b84fde83a9060478d28dbc111',
        size: 373,
        vsize: 373,
        fee: 0.00055950,
        value: 304.25060757,
        time: Date.now() / 1000 - 240,
        inputs: [
          { address: 'DPgY7z5Wdgz5QjQmfKWrFxHe3EULZ9Xfec', amount: 150.0 },
          { address: 'DTzBdW6s8kHKhkTZMmJfXHjCnhxnWq3CXx', amount: 154.25116707 }
        ],
        outputs: [
          { address: 'DGB7JqRudxccSxQ4vSiM1L16mdBx5VXQxv', amount: 304.25060757 }
        ],
        fee_rate: 150,
        priority: 'high',
        confirmations: 0,
        descendantcount: 1,
        descendantsize: 256,
        ancestorcount: 2,
        ancestorsize: 512
      },
      {
        txid: 'demo-72402be8b135dee84d0756ebd55e127236c5534889e5ec8dbf965705c741d84a',
        size: 191,
        vsize: 191,
        fee: 0.00001910,
        value: 15000.00000000,
        time: Date.now() / 1000 - 360,
        inputs: [
          { address: 'DKq4BTWY9dTioHp1DoHMvvTxPmFZy8wVZx', amount: 15000.00001910 }
        ],
        outputs: [
          { address: 'D5cYyPRsDpGcnNX2xt9wrGkcmRL6xT2pZz', amount: 15000.00000000 }
        ],
        fee_rate: 10,
        priority: 'low',
        confirmations: 0,
        descendantcount: 0,
        descendantsize: 0,
        ancestorcount: 0,
        ancestorsize: 0
      },
      {
        txid: 'demo-5051239b657785950ea4c6df203c6651837e110fa7c0967fde8988830666bdbb',
        size: 225,
        vsize: 225,
        fee: 0.00022500,
        value: 40160.36678283,
        time: Date.now() / 1000 - 480,
        inputs: [
          { address: 'DNLE4xyqfLaHqHbQuq2qRdtJGiHiwx7m1E', amount: 40160.36700783 }
        ],
        outputs: [
          { address: 'DDM8aVhanNqcg41LEaepK1wHdRRoWXbogX', amount: 40160.36678283 }
        ],
        fee_rate: 100,
        priority: 'high',
        confirmations: 0,
        descendantcount: 0,
        descendantsize: 0,
        ancestorcount: 0,
        ancestorsize: 0
      },
      {
        txid: 'demo-c375dab11b6b1066f982e8c2b7730fd9ab3d44228d8349afade426a459f97f14',
        size: 1522,
        vsize: 1522,
        fee: 0.00152200,
        value: 111.45505089,
        time: Date.now() / 1000 - 600,
        inputs: [
          { address: 'DB5MEeyRrHnS7CN5kVQ7vC5VKnQakLFJAZ', amount: 50.0 },
          { address: 'DCr8dAbqw8XGAr6UYtDeVvmwdzenhcZJqB', amount: 30.0 },
          { address: 'DJxQ5bN8D2vCa2EiVYBnjakVJT2VgCJAx7', amount: 31.45657289 }
        ],
        outputs: [
          { address: 'DLGX8h86c2VLjkty8Hyp5NPGJ3DYsvBQvC', amount: 111.45505089 }
        ],
        fee_rate: 100,
        priority: 'medium',
        confirmations: 0,
        descendantcount: 0,
        descendantsize: 0,
        ancestorcount: 3,
        ancestorsize: 1856
      }
    ]
  };

  // Transaction data state management
  const [mempoolTransactions, setMempoolTransactions] = useState([]);
  const [confirmedTransactions, setConfirmedTransactions] = useState([]);
  const [displayedMempool, setDisplayedMempool] = useState([]);
  const [displayedConfirmed, setDisplayedConfirmed] = useState([]);
  const [mempoolStats, setMempoolStats] = useState({
    size: 0,
    bytes: 0,
    usage: 0,
    maxmempool: 300000000,
    minfee: 0,
    avgfee: 0,
    totalfee: 0,
    feeDistribution: null
  });
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('time');
  
  // Pagination state
  const [mempoolPage, setMempoolPage] = useState(0);
  const [confirmedPage, setConfirmedPage] = useState(0);
  
  // Loading state
  const [loading, setLoading] = useState(true);
  
  // WebSocket ref and reconnection state
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  
  // Responsive design hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  /**
   * Filter and sort transactions based on current state
   */
  const filterAndSortTransactions = useCallback((transactions) => {
    let filtered = [...transactions];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.txid.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(tx => tx.priority === filterPriority);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'value':
          const aValue = a.value || calculateTotalValue(a.outputs);
          const bValue = b.value || calculateTotalValue(b.outputs);
          return bValue - aValue;
        case 'fee':
          return (b.fee || 0) - (a.fee || 0);
        case 'size':
          return (b.vsize || b.size || 0) - (a.vsize || a.size || 0);
        case 'time':
        default:
          return (b.time || b.blocktime || 0) - (a.time || a.blocktime || 0);
      }
    });
    
    return filtered;
  }, [searchTerm, filterPriority, sortBy]);

  /**
   * Memoized filtered transactions
   */
  const filteredMempool = useMemo(() => 
    filterAndSortTransactions(mempoolTransactions), 
    [mempoolTransactions, filterAndSortTransactions]
  );
  
  const filteredConfirmed = useMemo(() => 
    filterAndSortTransactions(confirmedTransactions), 
    [confirmedTransactions, filterAndSortTransactions]
  );

  /**
   * Load sample data on mount (temporary until backend is implemented)
   */
  useEffect(() => {
    // Simulate loading delay
    setTimeout(() => {
      setMempoolStats(sampleMempoolData.stats);
      setMempoolTransactions(sampleMempoolData.transactions);
      setLoading(false);
    }, 1000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * WebSocket connection setup with automatic reconnection
   * Handles initial connection, reconnection logic, and cleanup
   */
  useEffect(() => {
    let isMounted = true;

    const connectWebSocket = () => {
      if (!isMounted) return;

      const socket = new WebSocket(config.wsBaseUrl);
      wsRef.current = socket;

      /**
       * WebSocket connection opened successfully
       */
      socket.onopen = () => {
        console.log('WebSocket connection established for transactions page');
        reconnectAttemptsRef.current = 0;
        
        // Note: Current WebSocket server doesn't support mempool data
        // This is a placeholder for future backend implementation
      };

      /**
       * Handle incoming WebSocket messages with transaction data
       * @param {MessageEvent} event - WebSocket message event
       */
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'mempool') {
            /**
             * Process enhanced mempool data
             * Includes fee distribution and total value
             */
            console.log('Mempool data received:', message.data);
            setMempoolStats(message.data.stats || {});
            setMempoolTransactions(message.data.transactions || []);
            setLoading(false);
          } else if (message.type === 'recentTransactions') {
            /**
             * Process recent confirmed transactions
             * Shows individual transactions with confirmation counts
             */
            setConfirmedTransactions(message.data || []);
          } else if (message.type === 'newTransaction') {
            /**
             * Handle real-time new transaction
             * Prepends new transaction with animation
             */
            setMempoolTransactions((prevTxs) => [message.data, ...prevTxs]);
            // Update stats
            setMempoolStats((prevStats) => ({
              ...prevStats,
              size: prevStats.size + 1,
              bytes: prevStats.bytes + (message.data.vsize || message.data.size || 0),
              totalfee: prevStats.totalfee + (message.data.fee || 0)
            }));
          } else if (message.type === 'confirmedTransaction') {
            /**
             * Handle transaction confirmation
             * Moves from mempool to confirmed list
             */
            const confirmedTx = message.data;
            setMempoolTransactions((prevTxs) => 
              prevTxs.filter(tx => tx.txid !== confirmedTx.txid)
            );
            // Add to confirmed transactions if we have the full data
            if (confirmedTx.inputs && confirmedTx.outputs) {
              setConfirmedTransactions((prevTxs) => [confirmedTx, ...prevTxs]);
            }
          } else if (message.type === 'removedTransaction') {
            /**
             * Handle transaction removal (confirmed in block)
             * Removes transaction from mempool
             */
            setMempoolTransactions((prevTxs) => 
              prevTxs.filter(tx => tx.txid !== message.data.txid)
            );
          } else if (message.type === 'recentBlocks') {
            /**
             * Fallback for basic block data
             * Extract transactions from recent blocks if detailed tx data not available
             */
            console.log('Recent blocks received:', message.data);
            setLoading(false); // Stop loading when we get any data
            
            if (!confirmedTransactions.length && message.data) {
              const blockTxs = [];
              message.data.forEach(block => {
                if (block.txCount > 0) {
                  // Create placeholder entries for blocks
                  // In production, backend should send full transaction data
                  blockTxs.push({
                    blockHeight: block.height,
                    blockHash: block.hash,
                    txCount: block.txCount,
                    timestamp: block.timestamp,
                    miner: block.poolIdentifier || 'Unknown',
                    confirmations: 1,
                    placeholder: true
                  });
                }
              });
              if (blockTxs.length) {
                setConfirmedTransactions(blockTxs);
              }
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      /**
       * Handle WebSocket errors
       */
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      /**
       * Handle WebSocket connection closure with reconnection logic
       */
      socket.onclose = () => {
        console.log('WebSocket disconnected - attempting reconnection...');
        wsRef.current = null;

        if (isMounted) {
          // Exponential backoff for reconnection
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) {
              connectWebSocket();
            }
          }, timeout);
        }
      };
    };

    // Initial connection
    connectWebSocket();

    /**
     * Cleanup function to properly close WebSocket connection
     * and clear reconnection timeouts
     */
    return () => {
      isMounted = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  /**
   * Pagination effect for mempool transactions
   * Shows 20 transactions per page
   */
  useEffect(() => {
    const TRANSACTIONS_PER_PAGE = 20;
    const startIndex = mempoolPage * TRANSACTIONS_PER_PAGE;
    const endIndex = startIndex + TRANSACTIONS_PER_PAGE;
    setDisplayedMempool(filteredMempool.slice(startIndex, endIndex));
  }, [filteredMempool, mempoolPage]);

  /**
   * Pagination effect for confirmed transactions
   */
  useEffect(() => {
    const TRANSACTIONS_PER_PAGE = 20;
    const startIndex = confirmedPage * TRANSACTIONS_PER_PAGE;
    const endIndex = startIndex + TRANSACTIONS_PER_PAGE;
    setDisplayedConfirmed(filteredConfirmed.slice(startIndex, endIndex));
  }, [filteredConfirmed, confirmedPage]);

  /**
   * Reset page when filters change
   */
  useEffect(() => {
    setMempoolPage(0);
    setConfirmedPage(0);
  }, [searchTerm, filterPriority, sortBy]);

  /**
   * Pagination handlers
   */
  const handleMempoolPrevPage = () => setMempoolPage((prev) => prev - 1);
  const handleMempoolNextPage = () => setMempoolPage((prev) => prev + 1);
  const handleMempoolPageChange = (event, value) => setMempoolPage(value - 1);
  
  const handleConfirmedPrevPage = () => setConfirmedPage((prev) => prev - 1);
  const handleConfirmedNextPage = () => setConfirmedPage((prev) => prev + 1);
  const handleConfirmedPageChange = (event, value) => setConfirmedPage(value - 1);

  /**
   * Filter and sort handlers
   */
  const handleSearchChange = (value) => setSearchTerm(value);
  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) setFilterPriority(newFilter);
  };
  const handleSortChange = (event, newSort) => {
    if (newSort !== null) setSortBy(newSort);
  };

  // Calculate total pages
  const mempoolTotalPages = Math.ceil(filteredMempool.length / 20);
  const confirmedTotalPages = Math.ceil(filteredConfirmed.length / 20);

  return (
    <Box 
      sx={{ 
        py: 4, 
        backgroundImage: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
        minHeight: '100vh'
      }}
    >
      <Container maxWidth="lg">
        <HeroSection />

        {loading ? (
          <LoadingCard />
        ) : (
          <Fade in={true}>
            <Box>
              {/* Demo data notice - remove when backend is implemented */}
              <Card elevation={1} sx={{ mb: 3, bgcolor: '#fff3cd', border: '1px solid #ffeeba' }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="body2" sx={{ color: '#856404', textAlign: 'center' }}>
                    <strong>Demo Mode:</strong> Displaying sample transaction data. Real-time mempool monitoring requires backend WebSocket implementation with DigiByte node RPC access.
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#856404', textAlign: 'center', display: 'block', mt: 1 }}>
                    Backend requirements: DigiByte node with txindex=1, WebSocket server with mempool RPC endpoints
                  </Typography>
                </CardContent>
              </Card>
              
              <MempoolStats stats={mempoolStats} transactions={mempoolTransactions} />
              
              <SearchAndFilter
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                filterPriority={filterPriority}
                onFilterChange={handleFilterChange}
                sortBy={sortBy}
                onSortChange={handleSortChange}
              />
              
              {/* Mempool Transactions Section */}
              <Box sx={{ mb: 6 }}>
                <SectionHeader 
                  title="Mempool Transactions" 
                  subtitle={`${filteredMempool.length} unconfirmed transactions waiting to be included in a block`}
                  icon={PoolIcon}
                />
                
                {displayedMempool.length === 0 ? (
                  <EmptyState message={searchTerm || filterPriority !== 'all' ? "No transactions match your filters" : "No transactions in mempool"} />
                ) : (
                  <>
                    <Grid container spacing={2}>
                      {displayedMempool.map((transaction, index) => (
                        <TransactionCard
                          key={transaction.txid}
                          transaction={transaction}
                          index={index}
                          isMobile={isMobile}
                          isConfirmed={false}
                        />
                      ))}
                    </Grid>

                    {mempoolTotalPages > 1 && (
                      <PaginationControls
                        currentPage={mempoolPage}
                        totalPages={mempoolTotalPages}
                        onPrevPage={handleMempoolPrevPage}
                        onNextPage={handleMempoolNextPage}
                        onPageChange={handleMempoolPageChange}
                        isMobile={isMobile}
                        isTablet={isTablet}
                      />
                    )}
                  </>
                )}
              </Box>
              
              {/* Confirmed Transactions Section */}
              {confirmedTransactions.length > 0 && (
                <Box>
                  <Divider sx={{ my: 4 }} />
                  <SectionHeader 
                    title="Recent Confirmed Transactions" 
                    subtitle="Transactions recently included in DigiByte blocks"
                    icon={CheckCircleIcon}
                  />
                  
                  <Grid container spacing={2}>
                    {displayedConfirmed.map((transaction, index) => (
                      transaction.placeholder ? (
                        // Placeholder for block summary when full tx data not available
                        <Grid item xs={12} key={`block-${transaction.blockHeight}`}>
                          <Card elevation={2} sx={{ p: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Block {formatNumber(transaction.blockHeight)} contains {transaction.txCount} transactions
                              {' • '}Mined by {transaction.miner}
                              {' • '}{formatRelativeTime(transaction.timestamp)}
                            </Typography>
                          </Card>
                        </Grid>
                      ) : (
                        <TransactionCard
                          key={transaction.txid}
                          transaction={transaction}
                          index={index}
                          isMobile={isMobile}
                          isConfirmed={true}
                        />
                      )
                    ))}
                  </Grid>

                  {confirmedTotalPages > 1 && (
                    <PaginationControls
                      currentPage={confirmedPage}
                      totalPages={confirmedTotalPages}
                      onPrevPage={handleConfirmedPrevPage}
                      onNextPage={handleConfirmedNextPage}
                      onPageChange={handleConfirmedPageChange}
                      isMobile={isMobile}
                      isTablet={isTablet}
                    />
                  )}
                </Box>
              )}
            </Box>
          </Fade>
        )}
        
        {/* Live region for screen reader announcements */}
        <Box
          role="status"
          aria-live="polite"
          aria-atomic="true"
          sx={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}
        >
          New transaction added to mempool
        </Box>
      </Container>
    </Box>
  );
};

export default TxsPage;