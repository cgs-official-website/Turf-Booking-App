// hooks/useSubscription.js
import { useState, useEffect, useCallback } from 'react';
import * as subscriptionApi from '../services/subscription.service';

export const usePlans = (includeInactive = false) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await subscriptionApi.getAllPlans(includeInactive);
      setPlans(response.data.plans);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return { plans, loading, error, refetch: fetchPlans };
};

export const useMySubscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const response = await subscriptionApi.getMySubscription();
      setSubscription(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return { subscription, loading, error, refetch: fetchSubscription };
};

export const useSubscriptionHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await subscriptionApi.getMySubscriptionHistory();
      setHistory(response.data.subscriptions);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, error, refetch: fetchHistory };
};

export const useAdminSubscriptions = (filters = {}) => {
  const [data, setData] = useState({ subscriptions: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await subscriptionApi.getAllSubscriptions(filters);
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  return { ...data, loading, error, refetch: fetchSubscriptions };
};