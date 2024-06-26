import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Button } from '@mui/material';
import config from '../config';

const BlocksPage = () => {
  // State variables
  const [blocks, setBlocks] = useState([]); // Stores the list of all blocks received from the server
  const [displayedBlocks, setDisplayedBlocks] = useState([]); // Stores the blocks currently being displayed on the page
  const [currentPage, setCurrentPage] = useState(0); // Keeps track of the current page number
  const [loading, setLoading] = useState(true); // Indicates if the page is loading

  // WebSocket connection
  useEffect(() => {
    const socket = new WebSocket(config.wsBaseUrl);

    // Event handler for WebSocket connection open
    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    // Event handler for receiving messages from the server
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('Received message from server:', message);

      if (message.type === 'recentBlocks') {
        console.log('Received recent blocks:', message.data);
        // Set the initial recent blocks
        setBlocks(message.data);
        setLoading(false);
      } else if (message.type === 'newBlock') {
        console.log('Received new block:', message.data);
        // Add new block to the beginning of the blocks array
        setBlocks((prevBlocks) => [message.data, ...prevBlocks]);
      }
    };

    // Event handler for WebSocket connection close
    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Cleanup function to close the WebSocket connection when the component unmounts
    return () => {
      socket.close();
    };
  }, []);

  // Update the displayed blocks based on the current page
  useEffect(() => {
    const startIndex = currentPage * 10;
    const endIndex = startIndex + 10;
    setDisplayedBlocks(blocks.slice(startIndex, endIndex)); // Slice the blocks array to get the blocks for the current page
  }, [blocks, currentPage]);

  // Event handler for previous page button click
  const handlePrevPage = () => {
    setCurrentPage((prevPage) => prevPage - 1);
  };

  // Event handler for next page button click
  const handleNextPage = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  // Render the component
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h4" align="center" fontWeight="bold" gutterBottom sx={{ paddingTop: '10px' }}>
        Realtime DigiByte Blocks
      </Typography>
      <Typography variant="h7" component="p" align="center" gutterBottom sx={{ paddingBottom: '20px' }}>
        This page pre-loads the 10 most recent DGB blocks & will keep incrementing in realtime as long as you leave it open as blocks are mined.
      </Typography>
      {loading ? (
        <Typography variant="h5">Loading...</Typography>
      ) : (
        <>
          {displayedBlocks.map((block, index) => (
            <Grid
  container
  spacing={2}
  key={index}
  sx={{
    backgroundColor: index % 2 === 0 ? '#002352' : '#0066cc',
    color: 'white',
    marginBottom: '15px',
    borderRadius: '4px',
  }}
>
  <Grid item xs={3}>
    <Typography variant="body2" sx={{ fontWeight: 'bold', paddingTop: '3px', paddingBottom: '7px' }}>
      Height: {block.height}
    </Typography>
  </Grid>
  <Grid item xs={5}>
    <Typography variant="body2" sx={{ fontWeight: 'bold', paddingTop: '3px', paddingBottom: '7px', }}>
      Hash: {block.hash}
    </Typography>
  </Grid>
  <Grid item xs={2}>
    <Typography variant="body2" sx={{ fontWeight: 'bold', paddingTop: '3px', paddingBottom: '7px' }}>
      Algo: {block.algo}
    </Typography>
  </Grid>
  <Grid item xs={2}>
    <Typography variant="body2" sx={{ fontWeight: 'bold', paddingTop: '3px', paddingBottom: '7px' }}>
      TX Count: {block.txCount}
    </Typography>
  </Grid>
</Grid>
          ))}
          <Grid container justifyContent="space-between" mt={2}>
            <Button variant="contained" onClick={handlePrevPage} disabled={currentPage === 0}>
              Previous
            </Button>
            <Button variant="contained" onClick={handleNextPage} disabled={currentPage === Math.floor(blocks.length / 10)}>
              Next
            </Button>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default BlocksPage;