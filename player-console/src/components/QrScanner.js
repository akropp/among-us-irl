import React, { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Box, Button, Typography, CircularProgress } from '@mui/material';

// QR Scanner component using html5-qrcode
const QrScanner = ({ onScan, onError }) => {
  const [scanning, setScanning] = useState(false);
  const [html5QrCode, setHtml5QrCode] = useState(null);
  
  useEffect(() => {
    // Initialize scanner
    const qrCodeScanner = new Html5Qrcode("qr-reader");
    setHtml5QrCode(qrCodeScanner);
    
    // Clean up on unmount
    return () => {
      if (qrCodeScanner && qrCodeScanner.isScanning) {
        qrCodeScanner.stop().catch(error => console.error(error));
      }
    };
  }, []);
  
  const startScanner = () => {
    if (!html5QrCode) return;
    
    setScanning(true);
    
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    html5QrCode.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        // Success callback
        onScan(decodedText);
        stopScanner();
      },
      (errorMessage) => {
        // Error callback - just log for now
        console.log(errorMessage);
      }
    ).catch(err => {
      setScanning(false);
      if (onError) onError(err);
    });
  };
  
  const stopScanner = () => {
    if (html5QrCode && html5QrCode.isScanning) {
      html5QrCode.stop()
        .then(() => setScanning(false))
        .catch(err => console.error(err));
    }
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
      <div id="qr-reader" style={{ width: '100%', maxWidth: '500px' }}></div>
      
      {!scanning ? (
        <Button 
          variant="contained" 
          color="primary" 
          onClick={startScanner}
          sx={{ mt: 2 }}
        >
          Scan QR Code
        </Button>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
          <CircularProgress size={24} sx={{ mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Scanning...
          </Typography>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={stopScanner}
            sx={{ mt: 1 }}
          >
            Stop Scanning
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default QrScanner;
