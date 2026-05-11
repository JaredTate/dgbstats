import React, { useState, useRef, useCallback } from 'react';
import {
  Container, Typography, Box, Paper, Card, CardContent,
  Divider, Grid, Alert, Button, Select, MenuItem,
  FormControl, InputLabel, Chip
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SecurityIcon from '@mui/icons-material/Security';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import BackupIcon from '@mui/icons-material/Backup';
import SettingsIcon from '@mui/icons-material/Settings';

// ─── Application ID map ────────────────────────────────────────────
// Application ID = big-endian of pchMessageStart for that network
// (see src/kernel/chainparams.cpp and src/wallet/sqlite.cpp).
export const APPLICATION_IDS = {
  mainnet:        0xFAC3B6DA,
  'testnet19/20': 0xFCD1B8E2, // RC27 and earlier
  testnet21:      0xFDD2B9E3, // RC28
  testnet23:      0xFDD2B9E4, // RC29 / RC30
  testnet24:      0xFEC4B7E5, // RC34 — current testnet
  regtest:        0xFABFB5DA
};

// The network the tool currently migrates INTO by default. Bump this
// whenever a new testnet reset ships.
export const CURRENT_TESTNET = 'testnet24';

const ID_TO_NETWORK = Object.fromEntries(
  Object.entries(APPLICATION_IDS).map(([k, v]) => [v, k])
);

// ─── Pure helper functions (exported for testing) ──────────────────
const SQLITE_MAGIC = 'SQLite format 3\0';

export function isSqliteFile(buffer) {
  if (buffer.byteLength < 72) return false;
  const header = new Uint8Array(buffer, 0, 16);
  const str = String.fromCharCode(...header);
  return str === SQLITE_MAGIC;
}

export function readApplicationId(buffer) {
  const dv = new DataView(buffer);
  return dv.getUint32(68, false); // big-endian
}

export function detectNetwork(appId) {
  return ID_TO_NETWORK[appId] || 'unknown';
}

export function patchApplicationId(buffer, newAppId) {
  const copy = buffer.slice(0); // deep copy
  const dv = new DataView(copy);
  dv.setUint32(68, newAppId, false); // big-endian
  return copy;
}

function toHex(num) {
  return '0x' + num.toString(16).toUpperCase().padStart(8, '0');
}

function downloadBlob(buffer, filename) {
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Component ─────────────────────────────────────────────────────
const WalletConvertPage = () => {
  const [fileBuffer, setFileBuffer] = useState(null);
  const [fileName, setFileName] = useState('');
  const [currentAppId, setCurrentAppId] = useState(null);
  const [currentNetwork, setCurrentNetwork] = useState('');
  const [targetNetwork, setTargetNetwork] = useState(CURRENT_TESTNET);
  const [error, setError] = useState('');
  const [converted, setConverted] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback((file) => {
    setError('');
    setConverted(false);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target.result;

      if (!isSqliteFile(buffer)) {
        setError('This is not a valid SQLite database. wallet.dat files are SQLite databases — please select a valid wallet file.');
        setFileBuffer(null);
        setCurrentAppId(null);
        setCurrentNetwork('');
        return;
      }

      const appId = readApplicationId(buffer);
      const network = detectNetwork(appId);

      setFileBuffer(buffer);
      setCurrentAppId(appId);
      setCurrentNetwork(network);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleConvert = () => {
    if (!fileBuffer) return;
    const targetId = APPLICATION_IDS[targetNetwork];
    const patched = patchApplicationId(fileBuffer, targetId);
    downloadBlob(patched, 'wallet.dat');
    setConverted(true);
  };

  const handleDownloadBackup = () => {
    if (!fileBuffer) return;
    downloadBlob(fileBuffer, 'wallet.dat.bak');
  };

  const networkColor = (net) => {
    if (net === CURRENT_TESTNET) return '#4caf50';
    if (net.startsWith('testnet')) return '#ff9800';
    if (net === 'mainnet') return '#002352';
    if (net === 'regtest') return '#9c27b0';
    return '#757575';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero */}
      <Card
        elevation={2}
        sx={{
          borderRadius: '12px',
          mb: 4,
          overflow: 'hidden',
          backgroundImage: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
          border: '1px solid rgba(46, 125, 50, 0.2)'
        }}
      >
        <CardContent sx={{ py: 4, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
            <SwapHorizIcon sx={{ fontSize: '3rem', color: '#2e7d32', mr: 2 }} />
            <Typography
              variant="h2"
              component="h1"
              fontWeight="800"
              sx={{
                color: '#2e7d32',
                letterSpacing: '0.5px',
                fontSize: { xs: '1.8rem', sm: '2.3rem', md: '2.8rem' }
              }}
            >
              Wallet Converter
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ color: '#4caf50', mb: 2, fontWeight: 600 }}>
            Oracle Wallet Migration Tool
          </Typography>
          <Divider sx={{ maxWidth: '150px', mx: 'auto', mb: 2, borderColor: '#4caf50', borderWidth: 2 }} />
          <Typography variant="body1" sx={{ maxWidth: '800px', mx: 'auto', color: '#555' }}>
            Patch the SQLite <code>application_id</code> bytes in a wallet.dat file to migrate between testnet versions.
            Use this when copying an oracle wallet from one testnet to another —
            RC34 ships a new genesis block and new network magic bytes (<code>0xFEC4B7E5</code>, testnet24),
            so oracle wallets from RC30 or earlier will be rejected until they are converted.
          </Typography>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert
        severity="success"
        icon={<SecurityIcon />}
        sx={{ mb: 4, borderRadius: '8px', '& .MuiAlert-icon': { color: '#2e7d32' } }}
      >
        <Typography variant="body1">
          <strong>100% Client-Side:</strong> Your wallet.dat file <strong>never leaves your browser</strong>.
          All processing happens locally in JavaScript — no server upload, no network requests.
          Safe for wallets containing private keys.
        </Typography>
      </Alert>

      {/* Drop Zone */}
      <Card elevation={3} sx={{ mb: 4, borderRadius: '12px' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: '#2e7d32' }}>
            1. Select Wallet File
          </Typography>

          <Paper
            elevation={0}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            sx={{
              p: 6,
              textAlign: 'center',
              cursor: 'pointer',
              borderRadius: '12px',
              border: isDragOver
                ? '3px dashed #4caf50'
                : '3px dashed #c8e6c9',
              backgroundColor: isDragOver ? '#e8f5e9' : '#fafafa',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#4caf50',
                backgroundColor: '#f1f8e9'
              }
            }}
          >
            <UploadFileIcon sx={{ fontSize: '4rem', color: isDragOver ? '#4caf50' : '#9e9e9e', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#555', mb: 1 }}>
              Drag & drop your wallet.dat here, or click to select
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Accepts any wallet.dat file (SQLite database)
            </Typography>
          </Paper>

          <input
            ref={inputRef}
            type="file"
            data-testid="wallet-file-input"
            style={{ display: 'none' }}
            accept=".dat"
            onChange={handleInputChange}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 3, borderRadius: '8px' }}>
              {error}
            </Alert>
          )}

          {fileBuffer && currentAppId !== null && (
            <Paper elevation={1} sx={{ mt: 3, p: 3, backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>
                File Loaded: {fileName}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">Application ID</Typography>
                  <Typography variant="body1" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                    {toHex(currentAppId)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">Detected Network</Typography>
                  <Chip
                    label={currentNetwork}
                    size="small"
                    sx={{
                      mt: 0.5,
                      fontWeight: 'bold',
                      backgroundColor: networkColor(currentNetwork),
                      color: 'white'
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">File Size</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {(fileBuffer.byteLength / 1024).toFixed(1)} KB
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Convert Section */}
      {fileBuffer && (
        <Card elevation={3} sx={{ mb: 4, borderRadius: '12px' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: '#2e7d32' }}>
              2. Convert
            </Typography>

            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel id="target-network-label">Target Network</InputLabel>
                  <Select
                    labelId="target-network-label"
                    value={targetNetwork}
                    label="Target Network"
                    onChange={(e) => { setTargetNetwork(e.target.value); setConverted(false); }}
                  >
                    {Object.entries(APPLICATION_IDS).map(([name, id]) => (
                      <MenuItem key={name} value={name}>
                        {name} ({toHex(id)})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<DownloadIcon />}
                  onClick={handleConvert}
                  disabled={currentNetwork === targetNetwork}
                  sx={{
                    py: 1.5,
                    backgroundColor: '#2e7d32',
                    '&:hover': { backgroundColor: '#1b5e20' },
                    '&.Mui-disabled': { backgroundColor: '#c8e6c9' }
                  }}
                >
                  Convert & Download
                </Button>
                {currentNetwork === targetNetwork && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                    Wallet is already {targetNetwork}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} sm={4}>
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  startIcon={<BackupIcon />}
                  onClick={handleDownloadBackup}
                  sx={{
                    py: 1.5,
                    borderColor: '#2e7d32',
                    color: '#2e7d32',
                    '&:hover': { borderColor: '#1b5e20', backgroundColor: '#e8f5e9' }
                  }}
                >
                  Download Backup (.bak)
                </Button>
              </Grid>
            </Grid>

            {converted && (
              <Alert severity="success" sx={{ mt: 3, borderRadius: '8px' }}>
                <strong>Done!</strong> Your converted wallet.dat has been downloaded.
                The original file was not modified — only the downloaded copy has the new application_id.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card elevation={3} sx={{ mb: 4, borderRadius: '12px' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <SettingsIcon sx={{ fontSize: '2rem', color: '#2e7d32', mr: 1.5 }} />
            <Typography variant="h5" fontWeight="bold" sx={{ color: '#2e7d32' }}>
              Migration Instructions
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: '8px', height: '100%' }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  Step-by-Step Guide
                </Typography>
                <Box component="ol" sx={{ pl: 2, m: 0 }}>
                  <Typography component="li" variant="body2" sx={{ mb: 1.5 }}>
                    <strong>Stop</strong> your DigiByte node on the target testnet version.
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1.5 }}>
                    <strong>Back up</strong> your existing wallet.dat (use the backup button above).
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1.5 }}>
                    <strong>Select</strong> the wallet.dat from the source testnet in the drop zone above.
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1.5 }}>
                    <strong>Choose</strong> the target network and click "Convert & Download".
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1.5 }}>
                    <strong>Copy</strong> the downloaded wallet.dat to your target node's data directory.
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1.5 }}>
                    <strong>Add</strong> <code>walletcrosschain=1</code> to your <code>digibyte.conf</code>.
                  </Typography>
                  <Typography component="li" variant="body2">
                    <strong>Start</strong> your node — it will accept the converted wallet.
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 3, backgroundColor: '#f8f9fa', borderRadius: '8px', height: '100%' }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                  Required: digibyte.conf Setting
                </Typography>
                <Alert severity="warning" sx={{ mb: 2, borderRadius: '4px' }}>
                  Without this setting, the node will reject the converted wallet even after patching.
                </Alert>
                <Paper sx={{ p: 2, backgroundColor: '#1e1e1e', borderRadius: '4px', mb: 2 }}>
                  <Typography sx={{ fontFamily: 'monospace', color: '#4caf50', fontSize: '0.95rem' }}>
                    # Add to digibyte.conf:<br />
                    walletcrosschain=1
                  </Typography>
                </Paper>
                <Typography variant="body2" color="text.secondary">
                  This flag tells the DigiByte node to accept wallets with a different network's application_id.
                  It is required for cross-testnet wallet migration.
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  What This Tool Does
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  DigiByte wallet.dat files are SQLite databases. Bytes 68–71 store the <code>application_id</code> — a
                  4-byte big-endian identifier that the node checks on startup. Each network version has a
                  different magic value. This tool patches only those 4 bytes, leaving every other byte untouched.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Known Application IDs Reference */}
      <Card elevation={3} sx={{ borderRadius: '12px' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, color: '#2e7d32' }}>
            Known Application IDs
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(APPLICATION_IDS).map(([name, id]) => (
              <Grid item xs={6} sm={3} key={name}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    borderRadius: '8px',
                    borderTop: `3px solid ${networkColor(name)}`,
                    backgroundColor: '#f8f9fa'
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ color: networkColor(name) }}>
                    {name}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                    {toHex(id)}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default WalletConvertPage;
