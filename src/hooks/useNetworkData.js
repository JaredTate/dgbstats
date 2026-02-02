import { useState, useEffect, useCallback } from 'react';
import { useNetwork } from '../context/NetworkContext';

/**
 * Hook for fetching blockchain info with network awareness
 */
export const useBlockchainInfo = () => {
  const { getApiUrl } = useNetwork();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/getblockchaininfo'));
      if (!response.ok) throw new Error('Failed to fetch blockchain info');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
      console.error('Error fetching blockchain info:', err);
    } finally {
      setLoading(false);
    }
  }, [getApiUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching chain tx stats with network awareness
 */
export const useChainTxStats = () => {
  const { getApiUrl } = useNetwork();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(getApiUrl('/getchaintxstats'));
        if (!response.ok) throw new Error('Failed to fetch chain tx stats');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getApiUrl]);

  return { data, loading, error };
};

/**
 * Hook for fetching tx outset info with network awareness
 */
export const useTxOutsetInfo = () => {
  const { getApiUrl } = useNetwork();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(getApiUrl('/gettxoutsetinfo'));
        if (!response.ok) throw new Error('Failed to fetch tx outset info');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getApiUrl]);

  return { data, loading, error };
};

/**
 * Hook for fetching block reward with network awareness
 */
export const useBlockReward = () => {
  const { getApiUrl } = useNetwork();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(getApiUrl('/getblockreward'));
        if (!response.ok) throw new Error('Failed to fetch block reward');
        const result = await response.json();
        setData(parseFloat(result.blockReward?.blockreward));
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getApiUrl]);

  return { data, loading, error };
};

/**
 * Hook for WebSocket connection with network awareness
 */
export const useNetworkWebSocket = (onMessage) => {
  const { wsBaseUrl } = useNetwork();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = new WebSocket(wsBaseUrl);

    socket.onopen = () => {
      console.log('WebSocket connection established');
      setConnected(true);
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (onMessage) {
        onMessage(message);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      setConnected(false);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      socket.close();
    };
  }, [wsBaseUrl, onMessage]);

  return { connected };
};

export default {
  useBlockchainInfo,
  useChainTxStats,
  useTxOutsetInfo,
  useBlockReward,
  useNetworkWebSocket
};
